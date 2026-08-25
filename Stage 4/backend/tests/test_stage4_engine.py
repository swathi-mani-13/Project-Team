import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.models.entities import Student, ClassPeriod, AttendanceSession, PresenceEvent, AttendanceAnomaly, CameraStatus
from backend.app.config import settings
from backend.app.schemas.attendance_schemas import RecognitionEventInput
from backend.app.stage4.engine import Stage4AttendanceEngine
from backend.app.stage4.presence_tracker import PresenceTracker
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.stage4.camera_health import CameraHealthService
from backend.app.stage4.deduplicator import deduplicator
from backend.app.stage4.metrics import MetricsCalculator
from backend.app.main import app

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy.pool import StaticPool

# In-memory SQLite fixture for isolated testing
@pytest.fixture
def db_session():
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    deduplicator.clear()

    # Seed baseline class period
    period = ClassPeriod(
        class_id="CS101",
        period_id="P1",
        subject="Artificial Intelligence & Computer Vision",
        teacher_name="Dr. Alan Turing",
        class_start_time="09:00:00",
        class_end_time="10:00:00",
        date="2026-08-25",
        camera_id="CAM_01"
    )
    student = Student(student_id="23CS001", name="Harris Vance", class_id="CS101", email="harris@campus.edu")
    camera = CameraStatus(camera_id="CAM_01", name="Front AI Cam", location="Room 302", status="ONLINE", fps=30.0)
    
    db.add_all([period, student, camera])
    db.commit()

    yield db
    db.close()


@pytest.fixture
def api_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ==================================================
# STEP 3 — TEST ATTENDANCE FLOW
# ==================================================

def test_step3_attendance_on_time(db_session):
    """
    Detection: 09:00 -> Attendance = PRESENT, Entry Status = ON_TIME
    """
    t_start = datetime(2026, 8, 25, 9, 0, 0)
    event = RecognitionEventInput(
        student_id="23CS001",
        student_name="Harris Vance",
        class_id="CS101",
        period_id="P1",
        camera_id="CAM_01",
        confidence=0.95,
        timestamp=t_start
    )

    result = Stage4AttendanceEngine.process_recognition_event(db=db_session, event=event)

    assert result["status"] == "ATTENDANCE_RECORDED"
    assert result["attendance_status"] == "PRESENT"
    assert result["entry_status"] == "ON_TIME"
    assert result["late_minutes"] == 0

    session = db_session.query(AttendanceSession).filter(
        AttendanceSession.student_id == "23CS001",
        AttendanceSession.date == "2026-08-25"
    ).first()
    assert session is not None
    assert session.attendance_status == "PRESENT"
    assert session.entry_status == "ON_TIME"
    assert session.late_minutes == 0


def test_step3_attendance_late_entry(db_session):
    """
    Detection: 09:22 -> Attendance = PRESENT, Entry Status = LATE, Late Minutes = 22
    """
    # Use a new student on the same date for late entry test
    student_late = Student(student_id="23CS002", name="Elena Rostova", class_id="CS101")
    db_session.add(student_late)
    db_session.commit()

    t_late = datetime(2026, 8, 25, 9, 22, 0)
    event = RecognitionEventInput(
        student_id="23CS002",
        student_name="Elena Rostova",
        class_id="CS101",
        period_id="P1",
        camera_id="CAM_01",
        confidence=0.94,
        timestamp=t_late
    )

    result = Stage4AttendanceEngine.process_recognition_event(db=db_session, event=event)

    assert result["status"] == "ATTENDANCE_RECORDED"
    assert result["attendance_status"] == "PRESENT"
    assert result["entry_status"] == "LATE"
    assert result["late_minutes"] == 22

    session = db_session.query(AttendanceSession).filter(
        AttendanceSession.student_id == "23CS002",
        AttendanceSession.date == "2026-08-25"
    ).first()
    assert session is not None
    assert session.entry_status == "LATE"
    assert session.late_minutes == 22

    # Verify LATE_ENTRY anomaly logged with 22 minutes
    anomaly = db_session.query(AttendanceAnomaly).filter(
        AttendanceAnomaly.event_type == "LATE_ENTRY",
        AttendanceAnomaly.student_id == "23CS002"
    ).first()
    assert anomaly is not None
    assert "22" in anomaly.description


def test_step3_no_duplicate_records_created(db_session):
    """
    Ensure multiple recognitions do NOT create duplicate attendance sessions.
    """
    # 09:00 initial detection
    event1 = RecognitionEventInput(
        student_id="23CS001",
        class_id="CS101",
        period_id="P1",
        camera_id="CAM_01",
        confidence=0.95,
        timestamp=datetime(2026, 8, 25, 9, 0, 0)
    )
    Stage4AttendanceEngine.process_recognition_event(db=db_session, event=event1)

    # Clear deduplicator cache to simulate recognition in later interval
    deduplicator.clear()

    # 09:22 second detection
    event2 = RecognitionEventInput(
        student_id="23CS001",
        class_id="CS101",
        period_id="P1",
        camera_id="CAM_01",
        confidence=0.96,
        timestamp=datetime(2026, 8, 25, 9, 22, 0)
    )
    res2 = Stage4AttendanceEngine.process_recognition_event(db=db_session, event=event2)
    assert res2["status"] == "PRESENCE_UPDATED"

    # Verify strictly 1 attendance session exists in database
    sessions = db_session.query(AttendanceSession).filter(
        AttendanceSession.student_id == "23CS001",
        AttendanceSession.date == "2026-08-25"
    ).all()
    assert len(sessions) == 1
    assert sessions[0].attendance_status == "PRESENT"
    assert sessions[0].entry_status == "ON_TIME"  # Initial on-time status preserved


# ==================================================
# STEP 4 — TEST PRESENCE MONITORING TIMELINE
# ==================================================

def test_step4_presence_monitoring_full_flow(db_session):
    """
    09:00 -> detected (PRESENT)
    09:10 -> detected (PRESENT)
    09:20 -> detected (PRESENT)
    09:30 -> not detected (PRESENCE_UNVERIFIED)
    09:40 -> not detected (PRESENCE_UNVERIFIED)
    09:50 -> detected (PRESENCE_RESTORED)
    """
    # 09:00 -> detected
    Stage4AttendanceEngine.process_recognition_event(
        db=db_session,
        event=RecognitionEventInput(
            student_id="23CS001", class_id="CS101", period_id="P1", camera_id="CAM_01",
            confidence=0.95, timestamp=datetime(2026, 8, 25, 9, 0, 0)
        )
    )

    # 09:10 -> detected
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001"], interval_timestamp=datetime(2026, 8, 25, 9, 10, 0)
    )
    session = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS001").first()
    assert session.presence_status == "PRESENT"

    # 09:20 -> detected
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001"], interval_timestamp=datetime(2026, 8, 25, 9, 20, 0)
    )
    db_session.refresh(session)
    assert session.presence_status == "PRESENT"

    # 09:30 -> not detected
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=[], interval_timestamp=datetime(2026, 8, 25, 9, 30, 0)
    )
    db_session.refresh(session)
    assert session.presence_status == "PRESENCE_UNVERIFIED"
    assert session.missed_intervals == 1

    # 09:40 -> not detected
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=[], interval_timestamp=datetime(2026, 8, 25, 9, 40, 0)
    )
    db_session.refresh(session)
    assert session.presence_status == "PRESENCE_UNVERIFIED"
    assert session.missed_intervals == 2

    # 09:50 -> detected (PRESENCE_RESTORED)
    deduplicator.clear()
    res_restore = Stage4AttendanceEngine.process_recognition_event(
        db=db_session,
        event=RecognitionEventInput(
            student_id="23CS001", class_id="CS101", period_id="P1", camera_id="CAM_01",
            confidence=0.96, timestamp=datetime(2026, 8, 25, 9, 50, 0)
        )
    )
    assert res_restore["status"] == "PRESENCE_RESTORED"

    db_session.refresh(session)
    assert session.presence_status == "PRESENCE_RESTORED"
    assert session.presence_restored == True
    assert session.missed_intervals == 0

    # Verify timeline records in order
    events = db_session.query(PresenceEvent).filter(PresenceEvent.session_id == session.id).order_by(PresenceEvent.timestamp.asc()).all()
    assert len(events) >= 5
    badges = [e.status_badge for e in events]
    assert "PRESENT" in badges
    assert "UNVERIFIED" in badges
    assert "RESTORED" in badges


# ==================================================
# STEP 5 — TEST POSSIBLE EARLY EXIT
# ==================================================

def test_step5_possible_early_exit_flow(db_session):
    """
    09:00 -> detected
    09:10 -> detected
    09:20 -> detected
    09:30 -> not detected
    09:40 -> not detected
    09:50 -> not detected
    Expected: PRESENCE_EXCEPTION, possible_exit = True
    Safe terminology check: "Possible Early Exit", NOT "Student definitely left"
    """
    # 09:00 -> detected
    Stage4AttendanceEngine.process_recognition_event(
        db=db_session,
        event=RecognitionEventInput(student_id="23CS001", class_id="CS101", period_id="P1", camera_id="CAM_01", confidence=0.95, timestamp=datetime(2026, 8, 25, 9, 0, 0))
    )
    # 09:10 -> detected
    PresenceTracker.verify_period_presence(db=db_session, class_id="CS101", period_id="P1", detected_student_ids=["23CS001"], interval_timestamp=datetime(2026, 8, 25, 9, 10, 0))
    # 09:20 -> detected
    PresenceTracker.verify_period_presence(db=db_session, class_id="CS101", period_id="P1", detected_student_ids=["23CS001"], interval_timestamp=datetime(2026, 8, 25, 9, 20, 0))

    # 09:30 -> not detected (miss 1)
    PresenceTracker.verify_period_presence(db=db_session, class_id="CS101", period_id="P1", detected_student_ids=[], interval_timestamp=datetime(2026, 8, 25, 9, 30, 0))
    # 09:40 -> not detected (miss 2)
    PresenceTracker.verify_period_presence(db=db_session, class_id="CS101", period_id="P1", detected_student_ids=[], interval_timestamp=datetime(2026, 8, 25, 9, 40, 0))
    # 09:50 -> not detected (miss 3 -> ABSENCE_CONFIRMATION_INTERVALS reached)
    PresenceTracker.verify_period_presence(db=db_session, class_id="CS101", period_id="P1", detected_student_ids=[], interval_timestamp=datetime(2026, 8, 25, 9, 50, 0))

    session = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS001").first()
    assert session.presence_status == "PRESENCE_EXCEPTION"
    assert session.possible_exit == True

    # Check Anomaly
    anomaly = db_session.query(AttendanceAnomaly).filter(AttendanceAnomaly.event_type == "POSSIBLE_EARLY_EXIT").first()
    assert anomaly is not None
    assert anomaly.severity == "HIGH"
    assert "Possible early exit" in anomaly.description
    assert "definitely left" not in anomaly.description.lower()


# ==================================================
# STEP 6 — TEST ALL 8 ANOMALY TYPES
# ==================================================

def test_step6_all_eight_anomaly_types(db_session):
    now = datetime(2026, 8, 25, 9, 30, 0)

    # 1. UNKNOWN_FACE
    a1 = AnomalyDetector.log_unknown_face(db=db_session, class_id="CS101", period_id="P1", camera_id="CAM_01", confidence=0.55, timestamp=now)
    assert a1.event_type == "UNKNOWN_FACE"
    assert a1.severity == "MEDIUM"

    # 2. LOW_CONFIDENCE
    a2 = AnomalyDetector.log_low_confidence(db=db_session, student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1", camera_id="CAM_01", confidence=0.62, threshold=0.80, timestamp=now)
    assert a2.event_type == "LOW_CONFIDENCE"
    assert a2.severity == "LOW"

    # 3. DUPLICATE_RECOGNITION
    a3 = AnomalyDetector.log_duplicate_recognition(db=db_session, student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1", camera_id="CAM_01", timestamp=now)
    assert a3.event_type == "DUPLICATE_RECOGNITION"
    assert a3.severity == "LOW"

    # 4. PRESENCE_MISSING
    a4 = AnomalyDetector.log_presence_missing(db=db_session, student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1", camera_id="CAM_01", missed_intervals=1, timestamp=now)
    assert a4.event_type == "PRESENCE_MISSING"
    assert a4.severity == "MEDIUM"

    # 5. LATE_ENTRY
    a5 = AnomalyDetector.log_late_entry(db=db_session, student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1", camera_id="CAM_01", late_minutes=15, timestamp=now)
    assert a5.event_type == "LATE_ENTRY"
    assert a5.severity == "LOW"

    # 6. POSSIBLE_EARLY_EXIT
    a6 = AnomalyDetector.log_possible_early_exit(db=db_session, student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1", camera_id="CAM_01", missed_intervals=3, timestamp=now)
    assert a6.event_type == "POSSIBLE_EARLY_EXIT"
    assert a6.severity == "HIGH"

    # 7. CAMERA_OFFLINE
    a7 = AnomalyDetector.log_camera_offline(db=db_session, camera_id="CAM_01", camera_name="Front AI Cam", timestamp=now)
    assert a7.event_type == "CAMERA_OFFLINE"
    assert a7.severity == "CRITICAL"

    # 8. MISSING_RECOGNITION_DATA
    a8 = AnomalyDetector.log_missing_recognition_data(db=db_session, class_id="CS101", period_id="P1", camera_id="CAM_01", timestamp=now)
    assert a8.event_type == "MISSING_RECOGNITION_DATA"
    assert a8.severity == "HIGH"

    # Verify all 8 distinct types exist in DB
    distinct_types = db_session.query(AttendanceAnomaly.event_type).distinct().all()
    type_set = {t[0] for t in distinct_types}
    assert len(type_set) == 8


# ==================================================
# STEP 7 — TEST CAMERA FAILURE
# ==================================================

def test_step7_camera_offline_no_false_absent(db_session):
    """
    Simulate camera heartbeat stopping.
    Camera marked OFFLINE, CAMERA_OFFLINE anomaly logged,
    Students are NOT marked absent.
    """
    # 09:00 Student present
    Stage4AttendanceEngine.process_recognition_event(
        db=db_session,
        event=RecognitionEventInput(student_id="23CS001", class_id="CS101", period_id="P1", camera_id="CAM_01", confidence=0.95, timestamp=datetime(2026, 8, 25, 9, 0, 0))
    )

    # Set camera heartbeat to 120 seconds ago
    now = datetime(2026, 8, 25, 9, 15, 0)
    cam = db_session.query(CameraStatus).filter(CameraStatus.camera_id == "CAM_01").first()
    cam.last_heartbeat = now - timedelta(seconds=120)
    db_session.commit()

    # Trigger camera health check
    CameraHealthService.check_and_update_all_cameras(db=db_session, now=now)
    db_session.refresh(cam)
    assert cam.status == "OFFLINE"

    # Verify anomaly logged
    anom = db_session.query(AttendanceAnomaly).filter(AttendanceAnomaly.event_type == "CAMERA_OFFLINE").first()
    assert anom is not None
    assert anom.severity == "CRITICAL"

    # Verify student session is NOT marked absent
    session = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS001").first()
    assert session.attendance_status == "PRESENT"


# ==================================================
# STEP 8 — TEST DATABASE INTEGRITY & CONSTRAINTS
# ==================================================

def test_step8_database_uniqueness_and_relationships(db_session):
    # Unique constraint prevents 2 sessions for same student, class, period, date
    s1 = AttendanceSession(
        student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1",
        date="2026-08-25", camera_id="CAM_01", class_start_time="09:00:00", class_end_time="10:00:00",
        attendance_status="PRESENT"
    )
    db_session.add(s1)
    db_session.commit()

    # Adding a presence event to s1
    pe = PresenceEvent(
        session_id=s1.id, student_id="23CS001", class_id="CS101", period_id="P1",
        time_str="09:00", event_type="FIRST_DETECTION", status_badge="PRESENT", camera_id="CAM_01"
    )
    db_session.add(pe)
    db_session.commit()

    # Relationship navigation
    assert len(s1.presence_events) == 1
    assert pe.session.id == s1.id


# ==================================================
# STEP 9 — TEST APIs
# ==================================================

def test_step9_api_ingest_event(api_client, db_session):
    payload = {
        "student_id": "23CS001",
        "student_name": "Harris Vance",
        "class_id": "CS101",
        "period_id": "P1",
        "camera_id": "CAM_01",
        "confidence": 0.94,
        "timestamp": "2026-08-25T09:02:00"
    }
    response = api_client.post("/api/attendance/event", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ATTENDANCE_RECORDED"
    assert data["entry_status"] == "ON_TIME"


def test_step9_api_verify_presence(api_client, db_session):
    # Ingest initial attendance
    api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "class_id": "CS101", "period_id": "P1", "camera_id": "CAM_01",
        "confidence": 0.95, "timestamp": "2026-08-25T09:00:00"
    })

    # Trigger verify presence
    response = api_client.post(
        "/api/attendance/verify-presence",
        json={"class_id": "CS101", "period_id": "P1", "date": "2026-08-25"},
        params={"detected_student_ids": ["23CS001"]}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "SUCCESS"


def test_step9_api_camera_heartbeat_and_status(api_client, db_session):
    # Heartbeat
    hb_res = api_client.post("/api/attendance/camera/heartbeat", json={
        "camera_id": "CAM_01",
        "name": "Front AI Cam",
        "location": "Room 302",
        "status": "ONLINE",
        "fps": 30.0
    })
    assert hb_res.status_code == 200
    assert hb_res.json()["status"] == "SUCCESS"

    # Camera status GET
    status_res = api_client.get("/api/attendance/camera/status")
    assert status_res.status_code == 200
    cameras = status_res.json()
    assert len(cameras) >= 1
    assert cameras[0]["camera_id"] == "CAM_01"


def test_step9_api_summary_dashboard(api_client, db_session):
    # Ingest event
    api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "class_id": "CS101", "period_id": "P1", "camera_id": "CAM_01",
        "confidence": 0.95, "timestamp": "2026-08-25T09:00:00"
    })

    res = api_client.get("/api/attendance/summary?class_id=CS101&period_id=P1&date=2026-08-25")
    assert res.status_code == 200
    summary = res.json()
    assert summary["class_id"] == "CS101"
    assert summary["present_count"] == 1
    assert len(summary["students"]) == 1


def test_step9_api_student_timeline(api_client, db_session):
    api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "class_id": "CS101", "period_id": "P1", "camera_id": "CAM_01",
        "confidence": 0.95, "timestamp": "2026-08-25T09:00:00"
    })

    res = api_client.get("/api/attendance/student/23CS001/timeline?class_id=CS101&period_id=P1&date=2026-08-25")
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == "23CS001"
    assert data["attendance_status"] == "PRESENT"
    assert len(data["timeline"]) >= 1


def test_step9_api_student_percentage(api_client, db_session):
    res = api_client.get("/api/attendance/student/23CS001/percentage?working_days=80")
    assert res.status_code == 200
    data = res.json()
    assert "attendance_percentage" in data
    assert "status_classification" in data


def test_step9_api_anomalies_and_resolve(api_client, db_session):
    # Trigger low confidence to create anomaly
    api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "class_id": "CS101", "period_id": "P1", "camera_id": "CAM_01",
        "confidence": 0.50, "timestamp": "2026-08-25T09:00:00"
    })

    # Get anomalies
    anom_res = api_client.get("/api/attendance/anomalies")
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    assert len(anomalies) >= 1
    event_id = anomalies[0]["event_id"]

    # Resolve anomaly
    res_patch = api_client.patch(f"/api/attendance/anomalies/{event_id}/resolve", json={
        "resolved_by": "Dr. Alan Turing",
        "notes": "Verified via manual checklist"
    })
    assert res_patch.status_code == 200
    assert res_patch.json()["resolved"] == True


def test_step9_api_config_endpoints(api_client, db_session):
    # GET config
    get_res = api_client.get("/api/attendance/config")
    assert get_res.status_code == 200
    cfg = get_res.json()
    assert "late_threshold_minutes" in cfg

    # PUT config
    put_res = api_client.put("/api/attendance/config", json={
        "late_threshold_minutes": 8,
        "confidence_threshold": 0.85
    })
    assert put_res.status_code == 200
    assert put_res.json()["config"]["late_threshold_minutes"] == 8
    assert put_res.json()["config"]["confidence_threshold"] == 0.85

    # Restore default
    api_client.put("/api/attendance/config", json={
        "late_threshold_minutes": 5,
        "confidence_threshold": 0.80
    })


def test_step9_api_validation_errors(api_client, db_session):
    # Invalid confidence > 1.0 -> 422 Unprocessable Entity
    res1 = api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "class_id": "CS101", "period_id": "P1", "camera_id": "CAM_01",
        "confidence": 1.5
    })
    assert res1.status_code == 422

    # Missing class_id -> 422
    res2 = api_client.post("/api/attendance/event", json={
        "student_id": "23CS001", "confidence": 0.95, "camera_id": "CAM_01"
    })
    assert res2.status_code == 422

    # Resolve non-existent anomaly -> 404
    res3 = api_client.patch("/api/attendance/anomalies/NON_EXISTENT_ID/resolve", json={
        "resolved_by": "Admin"
    })
    assert res3.status_code == 404


# ==================================================
# STEP 15 — COMPLETE END-TO-END CLASSROOM SESSION
# ==================================================

def test_step15_end_to_end_classroom_session(db_session):
    """
    Class: AI, Period: 1, Start: 09:00
    Students: Harris (23CS001), Elena/John (23CS002), Devin/David (23CS005), Alex (23CS007)

    Simulate:
    09:00: Harris detected, John detected, David detected
    09:10: Harris detected, John detected, David detected
    09:20: Harris detected, John NOT detected, David detected
    09:30: Harris detected, John NOT detected, David NOT detected
    09:40: Harris detected, John detected, David NOT detected

    Expected:
    Harris: Present (on time)
    John: Presence Unverified -> Restored
    David: Presence Unverified / Possible Exit (3 consecutive misses: 09:30, 09:40, + final)
    Alex: Not detected (remains absent)
    """
    # Seed students
    s_john = Student(student_id="23CS002", name="Elena Rostova", class_id="CS101")
    s_david = Student(student_id="23CS005", name="Devin Wright", class_id="CS101")
    s_alex = Student(student_id="23CS007", name="Lucas Silva", class_id="CS101")
    db_session.add_all([s_john, s_david, s_alex])
    db_session.commit()

    # 1. 09:00 AM - Harris, John, David detected at class start
    t0 = datetime(2026, 8, 25, 9, 0, 0)
    for s_id in ["23CS001", "23CS002", "23CS005"]:
        Stage4AttendanceEngine.process_recognition_event(
            db=db_session,
            event=RecognitionEventInput(student_id=s_id, class_id="CS101", period_id="P1", camera_id="CAM_01", confidence=0.95, timestamp=t0)
        )

    # Verify initial attendance marked for all 3
    for s_id in ["23CS001", "23CS002", "23CS005"]:
        sess = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == s_id).first()
        assert sess is not None
        assert sess.attendance_status == "PRESENT"
        assert sess.entry_status == "ON_TIME"

    # 2. 09:10 AM - Harris, John, David detected
    t1 = datetime(2026, 8, 25, 9, 10, 0)
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001", "23CS002", "23CS005"], interval_timestamp=t1
    )

    # 3. 09:20 AM - Harris detected, John NOT detected, David detected
    t2 = datetime(2026, 8, 25, 9, 20, 0)
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001", "23CS005"], interval_timestamp=t2
    )
    sess_john = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS002").first()
    assert sess_john.presence_status == "PRESENCE_UNVERIFIED"
    assert sess_john.missed_intervals == 1

    # 4. 09:30 AM - Harris detected, John NOT detected, David NOT detected
    t3 = datetime(2026, 8, 25, 9, 30, 0)
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001"], interval_timestamp=t3
    )
    db_session.refresh(sess_john)
    sess_david = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS005").first()
    assert sess_john.presence_status == "PRESENCE_UNVERIFIED"
    assert sess_john.missed_intervals == 2
    assert sess_david.presence_status == "PRESENCE_UNVERIFIED"
    assert sess_david.missed_intervals == 1

    # 5. 09:40 AM - Harris detected, John detected (RESTORED), David NOT detected
    t4 = datetime(2026, 8, 25, 9, 40, 0)
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001", "23CS002"], interval_timestamp=t4
    )
    db_session.refresh(sess_john)
    db_session.refresh(sess_david)
    
    # John presence is restored
    assert sess_john.presence_status == "PRESENCE_RESTORED"
    assert sess_john.presence_restored == True
    assert sess_john.missed_intervals == 0

    # David missed interval 2
    assert sess_david.presence_status == "PRESENCE_UNVERIFIED"
    assert sess_david.missed_intervals == 2

    # 6. 09:50 AM - David misses interval 3 -> Triggers POSSIBLE EXIT
    t5 = datetime(2026, 8, 25, 9, 50, 0)
    PresenceTracker.verify_period_presence(
        db=db_session, class_id="CS101", period_id="P1",
        detected_student_ids=["23CS001", "23CS002"], interval_timestamp=t5
    )
    db_session.refresh(sess_david)
    assert sess_david.presence_status == "PRESENCE_EXCEPTION"
    assert sess_david.possible_exit == True

    # Check Alex (23CS007) was never detected -> zero attendance sessions
    alex_session = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS007").first()
    assert alex_session is None

    # Check Harris (23CS001) is PRESENT
    sess_harris = db_session.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS001").first()
    assert sess_harris.attendance_status == "PRESENT"
    assert sess_harris.entry_status == "ON_TIME"
    assert sess_harris.possible_exit == False

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.models.entities import (
    Student, ClassPeriod, AttendanceSession, PresenceEvent, AttendanceAnomaly, CameraStatus,
    AcademicSchedule, WeeklyWorkingDay, ScheduleSlot, Holiday, SpecialDateOverride
)
from backend.app.schemas.attendance_schemas import RecognitionEventInput
from backend.app.stage4.engine import Stage4AttendanceEngine
from backend.app.stage4.presence_tracker import PresenceTracker
from backend.app.stage4.schedule_engine import ScheduleEngine
from backend.app.stage4.deduplicator import deduplicator
from backend.app.main import app

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    deduplicator.clear()

    # 1. Academic Schedule
    sched = AcademicSchedule(
        academic_year="2026-2027",
        semester="Odd Semester",
        start_date="2026-08-01",
        end_date="2026-12-31",
        college_open_time="09:00:00",
        college_close_time="16:30:00",
        timezone="Asia/Kolkata",
        is_active=True
    )
    db.add(sched)

    # 2. Weekly Working Days (Mon-Fri working, Sat-Sun holiday)
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for idx, name in enumerate(day_names):
        db.add(WeeklyWorkingDay(day_index=idx, day_name=name, is_working_day=(idx < 5)))

    # 3. Schedule Slots
    slots = [
        ScheduleSlot(class_id="CS101", period_id="P1", name="Period 1", slot_type="CLASS", start_time="09:00:00", end_time="09:50:00", order_index=1),
        ScheduleSlot(class_id="CS101", period_id="P2", name="Period 2", slot_type="CLASS", start_time="09:50:00", end_time="10:40:00", order_index=2),
        ScheduleSlot(class_id="CS101", period_id="BREAK_1", name="Short Break", slot_type="BREAK", start_time="10:40:00", end_time="10:50:00", order_index=3),
        ScheduleSlot(class_id="CS101", period_id="P3", name="Period 3", slot_type="CLASS", start_time="10:50:00", end_time="11:40:00", order_index=4),
        ScheduleSlot(class_id="CS101", period_id="LUNCH", name="Lunch Break", slot_type="LUNCH", start_time="12:30:00", end_time="13:30:00", order_index=5),
        ScheduleSlot(class_id="CS101", period_id="P5", name="Period 5", slot_type="CLASS", start_time="13:30:00", end_time="14:20:00", order_index=6),
    ]
    db.add_all(slots)

    # 4. Holidays
    h1 = Holiday(name="Independence Day", start_date="2026-08-15", end_date="2026-08-15", holiday_type="NATIONAL")
    h2 = Holiday(name="Pongal Holidays", start_date="2027-01-14", end_date="2027-01-17", holiday_type="FESTIVAL")
    db.add_all([h1, h2])

    # 5. Special Working Day
    sp = SpecialDateOverride(date="2026-08-29", is_working_day=True, reason="Compensatory Working Day (Saturday)")
    db.add(sp)

    # 6. Student & Camera
    student = Student(student_id="23CS001", name="Harris Vance", class_id="CS101")
    camera = CameraStatus(camera_id="CAM_01", name="Front Cam", location="Room 302", status="ONLINE")
    db.add_all([student, camera])

    db.commit()
    yield db
    db.close()


@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==================================================
# 1. NORMAL WORKING DAY
# ==================================================
def test_case_1_normal_working_day(test_db):
    # 2026-08-25 is a Tuesday (working day)
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-25")
    assert res["is_working_day"] is True
    assert res["date_status"] == "WORKING_DAY"
    assert res["day_name"] == "Tuesday"


# ==================================================
# 2. SUNDAY (WEEKEND)
# ==================================================
def test_case_2_sunday_weekend(test_db):
    # 2026-08-23 is a Sunday
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-23")
    assert res["is_working_day"] is False
    assert res["date_status"] == "WEEKEND"
    assert res["day_name"] == "Sunday"


# ==================================================
# 3. NON-WORKING SATURDAY
# ==================================================
def test_case_3_non_working_saturday(test_db):
    # 2026-08-22 is a Saturday (not overridden)
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-22")
    assert res["is_working_day"] is False
    assert res["date_status"] == "WEEKEND"
    assert res["day_name"] == "Saturday"


# ==================================================
# 4. WORKING SATURDAY (CONFIGURED IN WEEKLY RULES)
# ==================================================
def test_case_4_working_saturday_configured(test_db):
    sat = test_db.query(WeeklyWorkingDay).filter(WeeklyWorkingDay.day_index == 5).first()
    sat.is_working_day = True
    test_db.commit()

    # 2026-08-22 is Saturday
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-22")
    assert res["is_working_day"] is True
    assert res["date_status"] == "WORKING_DAY"


# ==================================================
# 5. SINGLE-DAY HOLIDAY
# ==================================================
def test_case_5_single_day_holiday(test_db):
    # 2026-08-15 Independence Day
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-15")
    assert res["is_working_day"] is False
    assert res["date_status"] == "HOLIDAY"
    assert res["holiday_name"] == "Independence Day"


# ==================================================
# 6. MULTI-DAY DATE-RANGE HOLIDAY
# ==================================================
def test_case_6_multi_day_holiday(test_db):
    # Pongal range: 2027-01-14 to 2027-01-17
    for d in ["2027-01-14", "2027-01-15", "2027-01-16", "2027-01-17"]:
        res = ScheduleEngine.resolve_date_status(test_db, d)
        assert res["is_working_day"] is False
        assert res["date_status"] == "HOLIDAY"
        assert "Pongal" in res["holiday_name"]


# ==================================================
# 7. SPECIAL WORKING DAY (SATURDAY OVERRIDE)
# ==================================================
def test_case_7_special_working_day(test_db):
    # 2026-08-29 is a Saturday overridden as Special Working Day
    res = ScheduleEngine.resolve_date_status(test_db, "2026-08-29")
    assert res["is_working_day"] is True
    assert res["date_status"] == "SPECIAL_WORKING_DAY"
    assert "Compensatory" in res["override_reason"]


# ==================================================
# 8. CLASS PERIOD ACTIVE MONITORING
# ==================================================
def test_case_8_class_period(test_db):
    # 2026-08-25 at 09:10 IST (Period 1: 09:00 - 09:50)
    dt = datetime(2026, 8, 25, 9, 10, 0)
    slot_info = ScheduleEngine.resolve_time_slot(test_db, target_datetime=dt, class_id="CS101")
    assert slot_info["current_schedule_type"] == "CLASS"
    assert slot_info["is_monitoring_active"] is True
    assert slot_info["active_slot"].period_id == "P1"


# ==================================================
# 9. SHORT BREAK (MONITORING PAUSED)
# ==================================================
def test_case_9_short_break(test_db):
    # 2026-08-25 at 10:45 IST (Break: 10:40 - 10:50)
    dt = datetime(2026, 8, 25, 10, 45, 0)
    slot_info = ScheduleEngine.resolve_time_slot(test_db, target_datetime=dt, class_id="CS101")
    assert slot_info["current_schedule_type"] == "BREAK"
    assert slot_info["is_monitoring_active"] is False


# ==================================================
# 10. LUNCH BREAK (MONITORING PAUSED)
# ==================================================
def test_case_10_lunch_break(test_db):
    # 2026-08-25 at 12:50 IST (Lunch: 12:30 - 13:30)
    dt = datetime(2026, 8, 25, 12, 50, 0)
    slot_info = ScheduleEngine.resolve_time_slot(test_db, target_datetime=dt, class_id="CS101")
    assert slot_info["current_schedule_type"] == "LUNCH"
    assert slot_info["is_monitoring_active"] is False


# ==================================================
# 11. COLLEGE CLOSED (OUTSIDE 09:00 - 16:30)
# ==================================================
def test_case_11_college_closed(test_db):
    # 2026-08-25 at 07:30 IST (Before opening)
    dt_early = datetime(2026, 8, 25, 7, 30, 0)
    res_early = ScheduleEngine.resolve_time_slot(test_db, target_datetime=dt_early, class_id="CS101")
    assert res_early["current_schedule_type"] == "COLLEGE_CLOSED"
    assert res_early["is_monitoring_active"] is False

    # 2026-08-25 at 17:30 IST (After closing)
    dt_late = datetime(2026, 8, 25, 17, 30, 0)
    res_late = ScheduleEngine.resolve_time_slot(test_db, target_datetime=dt_late, class_id="CS101")
    assert res_late["current_schedule_type"] == "COLLEGE_CLOSED"
    assert res_late["is_monitoring_active"] is False


# ==================================================
# 12. OVERLAPPING PERIOD VALIDATION
# ==================================================
def test_case_12_overlapping_period_validation(test_db):
    # Try adding overlapping slot: 09:30 - 10:15 (overlaps with Period 1: 09:00-09:50)
    valid, msg = ScheduleEngine.validate_slots_no_overlap(
        db=test_db,
        class_id="CS101",
        start_time_str="09:30:00",
        end_time_str="10:15:00"
    )
    assert valid is False
    assert "overlaps" in msg

    # End before start
    valid2, msg2 = ScheduleEngine.validate_slots_no_overlap(
        db=test_db,
        class_id="CS101",
        start_time_str="10:00:00",
        end_time_str="09:00:00"
    )
    assert valid2 is False


# ==================================================
# 13. MONTHLY ATTENDANCE CALCULATION
# ==================================================
def test_case_13_monthly_attendance_calculation(test_db):
    # Seed 20 present sessions in August 2026 for student 23CS001
    for day in range(1, 26):
        d_str = f"2026-08-{day:02d}"
        d_info = ScheduleEngine.resolve_date_status(test_db, d_str)
        if d_info["is_working_day"] and day <= 20:
            sess = AttendanceSession(
                student_id="23CS001", student_name="Harris Vance", class_id="CS101", period_id="P1",
                date=d_str, camera_id="CAM_01", class_start_time="09:00:00", class_end_time="09:50:00",
                attendance_status="PRESENT", entry_status="ON_TIME"
            )
            test_db.add(sess)
    test_db.commit()

    report = ScheduleEngine.calculate_monthly_attendance(
        db=test_db, year=2026, month=8, student_id="23CS001", class_id="CS101"
    )

    assert report["year"] == 2026
    assert report["month"] == 8
    assert report["total_calendar_days"] == 31
    assert report["total_holidays"] >= 1  # 15th August
    assert report["present_days"] >= 10
    assert report["attendance_percentage"] > 0
    assert len(report["days"]) == 31


# ==================================================
# 14. HOLIDAYS STRICTLY EXCLUDED FROM WORKING DAYS
# ==================================================
def test_case_14_holidays_excluded_from_working_days(test_db):
    report = ScheduleEngine.calculate_monthly_attendance(
        db=test_db, year=2026, month=8, student_id="23CS001", class_id="CS101"
    )
    # 15th August is a Saturday/Holiday, must be excluded from working days
    aug_15 = next((d for d in report["days"] if d["date"] == "2026-08-15"), None)
    assert aug_15 is not None
    assert aug_15["is_working_day"] is False
    assert aug_15["date_status"] == "HOLIDAY"


# ==================================================
# 15 & 16. CAMERA OFFLINE DURING CLASS VS BREAK
# ==================================================
def test_case_15_16_camera_offline_handling(test_db):
    # Camera heartbeat failure
    cam = test_db.query(CameraStatus).filter(CameraStatus.camera_id == "CAM_01").first()
    cam.status = "OFFLINE"
    test_db.commit()

    # Recognition event during break: skipped cleanly
    dt_break = datetime(2026, 8, 25, 10, 45, 0)
    event_break = RecognitionEventInput(
        student_id="23CS001", class_id="CS101", period_id="BREAK_1", camera_id="CAM_01",
        confidence=0.95, timestamp=dt_break
    )
    res_break = Stage4AttendanceEngine.process_recognition_event(test_db, event_break)
    assert res_break["status"] == "SCHEDULE_INACTIVE"
    assert res_break["reason"] == "BREAK"


# ==================================================
# 17. RECOGNITION DURING LUNCH (SKIPPED WITHOUT PENALTY)
# ==================================================
def test_case_17_recognition_during_lunch(test_db):
    # 12:50 IST Lunch
    dt_lunch = datetime(2026, 8, 25, 12, 50, 0)
    event = RecognitionEventInput(
        student_id="23CS001", class_id="CS101", period_id="LUNCH", camera_id="CAM_01",
        confidence=0.95, timestamp=dt_lunch
    )
    result = Stage4AttendanceEngine.process_recognition_event(test_db, event)
    assert result["status"] == "SCHEDULE_INACTIVE"
    assert result["reason"] == "LUNCH"

    # Verify no absence or session was created
    session = test_db.query(AttendanceSession).filter(
        AttendanceSession.student_id == "23CS001",
        AttendanceSession.date == "2026-08-25"
    ).first()
    assert session is None


# ==================================================
# 18. RECOGNITION DURING HOLIDAY (SKIPPED WITHOUT PENALTY)
# ==================================================
def test_case_18_recognition_during_holiday(test_db):
    # 2026-08-15 Independence Day at 09:10 IST
    dt_holiday = datetime(2026, 8, 15, 3, 40, 0)
    event = RecognitionEventInput(
        student_id="23CS001", class_id="CS101", period_id="P1", camera_id="CAM_01",
        confidence=0.95, timestamp=dt_holiday
    )
    result = Stage4AttendanceEngine.process_recognition_event(test_db, event)
    assert result["status"] == "SCHEDULE_INACTIVE"
    assert result["reason"] == "HOLIDAY"
    assert result["holiday_name"] == "Independence Day"

    # Verify zero attendance sessions created on holiday
    count = test_db.query(AttendanceSession).filter(AttendanceSession.date == "2026-08-15").count()
    assert count == 0


# ==================================================
# 19. SCHEDULE API ENDPOINTS VALIDATION
# ==================================================
def test_case_19_schedule_api_endpoints(client, test_db):
    # GET /api/schedule/academic-calendar
    res_cal = client.get("/api/schedule/academic-calendar")
    assert res_cal.status_code == 200
    assert res_cal.json()["academic_year"] == "2026-2027"

    # PUT /api/schedule/academic-calendar
    res_put_cal = client.put("/api/schedule/academic-calendar", json={
        "college_open_time": "08:30:00",
        "college_close_time": "17:00:00"
    })
    assert res_put_cal.status_code == 200
    assert res_put_cal.json()["college_open_time"] == "08:30:00"

    # GET /api/schedule/weekly-working-days
    res_days = client.get("/api/schedule/weekly-working-days")
    assert res_days.status_code == 200
    assert len(res_days.json()) == 7

    # PUT /api/schedule/weekly-working-days/5 (Saturday -> Working)
    res_sat = client.put("/api/schedule/weekly-working-days/5", json={"is_working_day": True})
    assert res_sat.status_code == 200
    assert res_sat.json()["is_working_day"] is True

    # GET /api/schedule/periods
    res_periods = client.get("/api/schedule/periods")
    assert res_periods.status_code == 200
    assert len(res_periods.json()) >= 6

    # POST /api/schedule/periods (Create non-overlapping slot)
    res_create_slot = client.post("/api/schedule/periods", json={
        "class_id": "CS101",
        "period_id": "P8",
        "name": "Period 8 (Lab)",
        "slot_type": "CLASS",
        "start_time": "16:00:00",
        "end_time": "16:30:00",
        "order_index": 10
    })
    assert res_create_slot.status_code == 200
    slot_id = res_create_slot.json()["id"]

    # DELETE /api/schedule/periods/{id}
    res_del_slot = client.delete(f"/api/schedule/periods/{slot_id}")
    assert res_del_slot.status_code == 200

    # POST /api/schedule/holidays
    res_hol = client.post("/api/schedule/holidays", json={
        "name": "Diwali Vacation",
        "start_date": "2026-11-08",
        "end_date": "2026-11-12",
        "holiday_type": "FESTIVAL"
    })
    assert res_hol.status_code == 200
    hol_id = res_hol.json()["id"]

    # DELETE /api/schedule/holidays/{id}
    res_del_hol = client.delete(f"/api/schedule/holidays/{hol_id}")
    assert res_del_hol.status_code == 200

    # GET /api/schedule/monthly-attendance
    res_month = client.get("/api/schedule/monthly-attendance?student_id=23CS001&year=2026&month=8")
    assert res_month.status_code == 200
    data = res_month.json()
    assert "days" in data
    assert "attendance_percentage" in data

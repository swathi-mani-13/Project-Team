import json
from datetime import datetime, timezone
from typing import List, Optional, Set
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.config import settings

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
from backend.app.models.entities import (
    Student, ClassPeriod, AttendanceSession, PresenceEvent, AttendanceAnomaly, CameraStatus
)
from backend.app.schemas.attendance_schemas import (
    RecognitionEventInput,
    PresenceVerificationInput,
    CameraHeartbeatInput,
    AnomalyResolveInput,
    AttendanceSessionSchema,
    StudentTimelineResponse,
    AttendancePercentageResponse,
    AttendanceSummaryResponse,
    AttendanceAnomalySchema,
    CameraStatusSchema,
    ConfigUpdateSchema,
    PresenceEventSchema,
    MonthlyAttendanceResponse
)
from backend.app.stage4.engine import Stage4AttendanceEngine
from backend.app.stage4.presence_tracker import PresenceTracker
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.stage4.camera_health import CameraHealthService
from backend.app.stage4.metrics import MetricsCalculator
from backend.app.stages_pipeline.simulator import Stage123PipelineSimulator

router = APIRouter(prefix=settings.API_PREFIX, tags=["Stage 4 - Attendance & Presence"])

# WebSocket Manager for Real-Time Dashboard updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()


# 1. Ingest Stage 1-3 Recognition Event
@router.post("/event", summary="Ingest recognition event from Stages 1-3")
async def ingest_recognition_event(
    event: RecognitionEventInput,
    db: Session = Depends(get_db)
):
    result = Stage4AttendanceEngine.process_recognition_event(db=db, event=event)
    
    # Broadcast event to real-time WebSocket dashboard
    await ws_manager.broadcast({
        "type": "RECOGNITION_EVENT",
        "data": result,
        "raw_event": event.model_dump(mode="json"),
        "timestamp": utc_now().isoformat()
    })
    
    return result


# 2. Continuous Presence Verification Trigger
@router.post("/verify-presence", summary="Execute continuous presence verification interval check")
async def verify_presence(
    payload: PresenceVerificationInput,
    detected_student_ids: List[str] = Query(default=[]),
    db: Session = Depends(get_db)
):
    sessions = PresenceTracker.verify_period_presence(
        db=db,
        class_id=payload.class_id,
        period_id=payload.period_id,
        detected_student_ids=detected_student_ids,
        interval_timestamp=payload.interval_timestamp
    )
    
    # Broadcast presence update to WebSocket
    await ws_manager.broadcast({
        "type": "PRESENCE_VERIFIED_INTERVAL",
        "class_id": payload.class_id,
        "period_id": payload.period_id,
        "updated_sessions_count": len(sessions),
        "timestamp": utc_now().isoformat()
    })

    return {
        "status": "SUCCESS",
        "class_id": payload.class_id,
        "period_id": payload.period_id,
        "verified_sessions_count": len(sessions)
    }


# 3. Camera Heartbeat
@router.post("/camera/heartbeat", summary="Record camera status/heartbeat")
async def camera_heartbeat(
    payload: CameraHeartbeatInput,
    db: Session = Depends(get_db)
):
    cam = CameraHealthService.record_heartbeat(
        db=db,
        camera_id=payload.camera_id,
        name=payload.name,
        location=payload.location,
        status=payload.status or "ONLINE",
        fps=payload.fps or 30.0
    )
    return {"status": "SUCCESS", "camera": cam.camera_id, "state": cam.status}


# 4. Get Student Attendance Record
@router.get("/student/{student_id}", summary="Get attendance records for a student")
def get_student_attendance(
    student_id: str,
    class_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceSession).filter(AttendanceSession.student_id == student_id)
    if class_id:
        query = query.filter(AttendanceSession.class_id == class_id)
    sessions = query.order_by(AttendanceSession.created_at.desc()).all()
    return sessions


# 5. Get Class Attendance
@router.get("/class/{class_id}", summary="Get attendance records for a class")
def get_class_attendance(
    class_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_date = date or utc_now().strftime("%Y-%m-%d")
    sessions = db.query(AttendanceSession).filter(
        AttendanceSession.class_id == class_id,
        AttendanceSession.date == target_date
    ).all()
    return sessions


# 6. Get Attendance by Date
@router.get("/date/{date}", summary="Get all attendance records for a specific date")
def get_attendance_by_date(
    date: str,
    db: Session = Depends(get_db)
):
    sessions = db.query(AttendanceSession).filter(AttendanceSession.date == date).all()
    return sessions


# 7. Attendance Summary Dashboard KPIs
@router.get("/summary", response_model=AttendanceSummaryResponse, summary="Get summary metrics for dashboard")
def get_attendance_summary(
    class_id: str = "CS101",
    period_id: str = "P1",
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_date = date or utc_now().strftime("%Y-%m-%d")

    # Update camera offline checks
    cameras = CameraHealthService.check_and_update_all_cameras(db=db)
    active_cam = next((c for c in cameras if c.camera_id == "CAM_01"), None)
    cam_status_str = active_cam.status if active_cam else "ONLINE"

    # Get all registered students in class
    total_class_students = db.query(Student).filter(Student.class_id == class_id).count() or 8

    # Get all sessions for this period
    sessions = db.query(AttendanceSession).filter(
        AttendanceSession.class_id == class_id,
        AttendanceSession.period_id == period_id,
        AttendanceSession.date == target_date
    ).all()

    present_count = len([s for s in sessions if s.attendance_status == "PRESENT"])
    late_count = len([s for s in sessions if s.entry_status == "LATE"])
    unverified_count = len([s for s in sessions if s.presence_status == "PRESENCE_UNVERIFIED"])
    possible_exit_count = len([s for s in sessions if s.possible_exit or s.presence_status == "PRESENCE_EXCEPTION"])

    # Unknown face anomalies count for today
    unknown_faces_count = db.query(AttendanceAnomaly).filter(
        AttendanceAnomaly.event_type == "UNKNOWN_FACE",
        AttendanceAnomaly.class_id == class_id,
        AttendanceAnomaly.resolved == False
    ).count()

    # Average attendance percentage
    avg_pct = round((present_count / max(1, total_class_students)) * 100, 1)

    return AttendanceSummaryResponse(
        class_id=class_id,
        period_id=period_id,
        date=target_date,
        total_students=total_class_students,
        present_count=present_count,
        late_count=late_count,
        presence_unverified_count=unverified_count,
        possible_exit_count=possible_exit_count,
        unknown_faces_count=unknown_faces_count,
        camera_status=cam_status_str,
        average_attendance_percentage=avg_pct,
        students=sessions
    )


# 8. Get Anomalies
@router.get("/anomalies", response_model=List[AttendanceAnomalySchema], summary="Get attendance & presence anomalies")
def get_anomalies(
    class_id: Optional[str] = None,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceAnomaly)
    if class_id:
        query = query.filter(AttendanceAnomaly.class_id == class_id)
    if severity:
        query = query.filter(AttendanceAnomaly.severity == severity)
    if resolved is not None:
        query = query.filter(AttendanceAnomaly.resolved == resolved)
    if event_type:
        query = query.filter(AttendanceAnomaly.event_type == event_type)
    
    return query.order_by(AttendanceAnomaly.timestamp.desc()).limit(limit).all()


# 9. Resolve Anomaly
@router.patch("/anomalies/{event_id}/resolve", summary="Mark an anomaly as resolved")
async def resolve_anomaly(
    event_id: str,
    payload: AnomalyResolveInput,
    db: Session = Depends(get_db)
):
    anomaly = db.query(AttendanceAnomaly).filter(AttendanceAnomaly.event_id == event_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    anomaly.resolved = True
    anomaly.resolved_at = utc_now()
    anomaly.resolved_by = payload.resolved_by
    if payload.notes:
        anomaly.description += f" [Resolution: {payload.notes}]"
    
    db.commit()
    db.refresh(anomaly)

    await ws_manager.broadcast({
        "type": "ANOMALY_RESOLVED",
        "event_id": anomaly.event_id,
        "resolved_by": anomaly.resolved_by
    })

    return anomaly


# 10. Get Student Presence Timeline
@router.get("/student/{student_id}/timeline", response_model=StudentTimelineResponse, summary="Get student presence timeline")
def get_student_timeline(
    student_id: str,
    class_id: str = "CS101",
    period_id: str = "P1",
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_date = date or utc_now().strftime("%Y-%m-%d")
    
    student = db.query(Student).filter(Student.student_id == student_id).first()
    session = db.query(AttendanceSession).filter(
        AttendanceSession.student_id == student_id,
        AttendanceSession.class_id == class_id,
        AttendanceSession.period_id == period_id,
        AttendanceSession.date == target_date
    ).first()

    if not session:
        return StudentTimelineResponse(
            student_id=student_id,
            student_name=student.name if student else f"Student {student_id}",
            class_id=class_id,
            period_id=period_id,
            date=target_date,
            attendance_status="ABSENT",
            entry_status="NOT_ARRIVED",
            late_minutes=0,
            current_presence_status="ABSENT",
            possible_exit=False,
            timeline=[]
        )

    events = db.query(PresenceEvent).filter(
        PresenceEvent.session_id == session.id
    ).order_by(PresenceEvent.timestamp.asc()).all()

    return StudentTimelineResponse(
        student_id=session.student_id,
        student_name=session.student_name,
        class_id=session.class_id,
        period_id=session.period_id,
        date=session.date,
        attendance_status=session.attendance_status,
        entry_status=session.entry_status,
        late_minutes=session.late_minutes,
        current_presence_status=session.presence_status,
        possible_exit=session.possible_exit,
        first_detected_at=session.first_detected_at,
        last_detected_at=session.last_detected_at,
        timeline=[PresenceEventSchema.model_validate(e) for e in events]
    )


# 11. Get Student Attendance Percentage
@router.get("/student/{student_id}/percentage", response_model=AttendancePercentageResponse, summary="Calculate student attendance %")
def get_student_attendance_percentage(
    student_id: str,
    class_id: Optional[str] = None,
    working_days: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return MetricsCalculator.calculate_student_percentage(
        db=db,
        student_id=student_id,
        class_id=class_id,
        working_days=working_days
    )


# 11b. Get Monthly Attendance Breakdown & Calendar
@router.get("/monthly", response_model=MonthlyAttendanceResponse, summary="Calculate monthly attendance with calendar grid")
def get_monthly_attendance_endpoint(
    student_id: str = "23CS001",
    year: int = Query(default=2026, ge=2020, le=2035),
    month: int = Query(default=8, ge=1, le=12),
    class_id: str = "CS101",
    db: Session = Depends(get_db)
):
    from backend.app.stage4.schedule_engine import ScheduleEngine
    return ScheduleEngine.calculate_monthly_attendance(
        db=db,
        year=year,
        month=month,
        student_id=student_id,
        class_id=class_id
    )


# 12. Get Camera Statuses
@router.get("/camera/status", response_model=List[CameraStatusSchema], summary="Get real-time camera statuses")
def get_camera_status(db: Session = Depends(get_db)):
    return CameraHealthService.check_and_update_all_cameras(db=db)


# 13. Dynamic Configuration Endpoints
@router.get("/config", summary="Get Stage 4 engine configuration")
def get_config():
    return {
        "late_threshold_minutes": settings.LATE_THRESHOLD_MINUTES,
        "verification_interval_minutes": settings.VERIFICATION_INTERVAL_MINUTES,
        "absence_confirmation_intervals": settings.ABSENCE_CONFIRMATION_INTERVALS,
        "recognition_deduplication_seconds": settings.RECOGNITION_DEDUPLICATION_SECONDS,
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "camera_timeout_seconds": settings.CAMERA_TIMEOUT_SECONDS,
        "attendance_good_threshold": settings.ATTENDANCE_GOOD_THRESHOLD,
        "attendance_warning_threshold": settings.ATTENDANCE_WARNING_THRESHOLD,
        "default_working_days": settings.DEFAULT_WORKING_DAYS
    }

@router.put("/config", summary="Update Stage 4 engine configuration at runtime")
def update_config(payload: ConfigUpdateSchema):
    if payload.late_threshold_minutes is not None:
        settings.LATE_THRESHOLD_MINUTES = payload.late_threshold_minutes
    if payload.verification_interval_minutes is not None:
        settings.VERIFICATION_INTERVAL_MINUTES = payload.verification_interval_minutes
    if payload.absence_confirmation_intervals is not None:
        settings.ABSENCE_CONFIRMATION_INTERVALS = payload.absence_confirmation_intervals
    if payload.recognition_deduplication_seconds is not None:
        settings.RECOGNITION_DEDUPLICATION_SECONDS = payload.recognition_deduplication_seconds
    if payload.confidence_threshold is not None:
        settings.CONFIDENCE_THRESHOLD = payload.confidence_threshold
    if payload.camera_timeout_seconds is not None:
        settings.CAMERA_TIMEOUT_SECONDS = payload.camera_timeout_seconds
    if payload.attendance_good_threshold is not None:
        settings.ATTENDANCE_GOOD_THRESHOLD = payload.attendance_good_threshold
    if payload.attendance_warning_threshold is not None:
        settings.ATTENDANCE_WARNING_THRESHOLD = payload.attendance_warning_threshold

    return {"status": "CONFIG_UPDATED", "config": get_config()}


# 14. Helper Simulator Event Trigger
@router.post("/simulate-event", summary="Simulate Stage 1-3 face recognition event")
async def simulate_event(
    student_id: Optional[str] = None,
    confidence: Optional[float] = None,
    class_id: str = "CS101",
    period_id: str = "P1",
    camera_id: str = "CAM_01",
    db: Session = Depends(get_db)
):
    simulated = Stage123PipelineSimulator.generate_single_event(
        student_id=student_id,
        confidence=confidence,
        class_id=class_id,
        period_id=period_id,
        camera_id=camera_id
    )
    event_input = RecognitionEventInput(
        student_id=simulated.student_id,
        student_name=simulated.student_name,
        class_id=simulated.class_id,
        period_id=simulated.period_id,
        camera_id=simulated.camera_id,
        timestamp=simulated.timestamp,
        confidence=simulated.confidence,
        bbox=simulated.bbox,
        face_id=simulated.face_id
    )
    return await ingest_recognition_event(event=event_input, db=db)

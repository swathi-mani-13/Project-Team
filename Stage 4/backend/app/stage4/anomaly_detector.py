from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy.orm import Session
from backend.app.models.entities import AttendanceAnomaly

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class AnomalyDetector:
    """
    Detects and logs all 8 Stage 4 anomaly types:
    1. UNKNOWN_FACE
    2. LOW_CONFIDENCE
    3. DUPLICATE_RECOGNITION
    4. PRESENCE_MISSING
    5. LATE_ENTRY
    6. POSSIBLE_EARLY_EXIT
    7. CAMERA_OFFLINE
    8. MISSING_RECOGNITION_DATA
    """

    @staticmethod
    def log_anomaly(
        db: Session,
        event_type: str,
        description: str,
        severity: str = "MEDIUM",
        student_id: Optional[str] = None,
        student_name: Optional[str] = None,
        class_id: Optional[str] = None,
        period_id: Optional[str] = None,
        camera_id: Optional[str] = None,
        confidence: Optional[float] = None,
        timestamp: Optional[datetime] = None,
    ) -> AttendanceAnomaly:
        ts = timestamp or utc_now()
        event_id = f"ANOM-{uuid.uuid4().hex[:10].upper()}"

        # Avoid redundant duplicate anomalies for the exact same event in a short window
        existing = db.query(AttendanceAnomaly).filter(
            AttendanceAnomaly.event_type == event_type,
            AttendanceAnomaly.student_id == student_id,
            AttendanceAnomaly.camera_id == camera_id,
            AttendanceAnomaly.resolved == False
        ).order_by(AttendanceAnomaly.timestamp.desc()).first()

        if existing and (ts - existing.timestamp).total_seconds() < 60 and event_type in ["LOW_CONFIDENCE", "DUPLICATE_RECOGNITION"]:
            return existing

        anomaly = AttendanceAnomaly(
            event_id=event_id,
            event_type=event_type,
            student_id=student_id,
            student_name=student_name,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=ts,
            confidence=confidence,
            severity=severity,
            description=description,
            resolved=False
        )
        db.add(anomaly)
        db.commit()
        db.refresh(anomaly)
        return anomaly

    # 1. UNKNOWN_FACE
    @staticmethod
    def log_unknown_face(db: Session, class_id: str, period_id: str, camera_id: str, confidence: float, timestamp: Optional[datetime] = None):
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="UNKNOWN_FACE",
            description=f"Unknown / unregistered face detected at camera {camera_id} with confidence {confidence:.2f}.",
            severity="MEDIUM",
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            confidence=confidence,
            timestamp=timestamp
        )

    # 2. LOW_CONFIDENCE
    @staticmethod
    def log_low_confidence(db: Session, student_id: Optional[str], student_name: Optional[str], class_id: str, period_id: str, camera_id: str, confidence: float, threshold: float, timestamp: Optional[datetime] = None):
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="LOW_CONFIDENCE",
            description=f"Recognition confidence {confidence:.2f} is below required threshold ({threshold:.2f}). Attendance not automatically marked.",
            severity="LOW",
            student_id=student_id,
            student_name=student_name,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            confidence=confidence,
            timestamp=timestamp
        )

    # 3. DUPLICATE_RECOGNITION
    @staticmethod
    def log_duplicate_recognition(db: Session, student_id: str, student_name: Optional[str], class_id: str, period_id: str, camera_id: str, timestamp: Optional[datetime] = None):
        name_str = student_name or student_id
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="DUPLICATE_RECOGNITION",
            description=f"Duplicate recognition detected for student {name_str} ({student_id}) on camera {camera_id} within deduplication window.",
            severity="LOW",
            student_id=student_id,
            student_name=name_str,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=timestamp
        )

    # 4. PRESENCE_MISSING
    @staticmethod
    def log_presence_missing(db: Session, student_id: str, student_name: Optional[str], class_id: str, period_id: str, camera_id: str, missed_intervals: int = 1, timestamp: Optional[datetime] = None):
        name_str = student_name or student_id
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="PRESENCE_MISSING",
            description=f"Presence missing: Student {name_str} ({student_id}) not detected during routine verification interval (missed intervals: {missed_intervals}).",
            severity="MEDIUM",
            student_id=student_id,
            student_name=name_str,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=timestamp
        )

    # 5. LATE_ENTRY
    @staticmethod
    def log_late_entry(db: Session, student_id: str, student_name: str, class_id: str, period_id: str, camera_id: str, late_minutes: int, timestamp: Optional[datetime] = None):
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="LATE_ENTRY",
            description=f"Student {student_name} ({student_id}) arrived late by {late_minutes} minutes.",
            severity="LOW",
            student_id=student_id,
            student_name=student_name,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=timestamp
        )

    # 6. POSSIBLE_EARLY_EXIT
    @staticmethod
    def log_possible_early_exit(db: Session, student_id: str, student_name: str, class_id: str, period_id: str, camera_id: str, missed_intervals: int, timestamp: Optional[datetime] = None):
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="POSSIBLE_EARLY_EXIT",
            description=f"Possible early exit: Student {student_name} ({student_id}) was unverified for {missed_intervals} consecutive intervals. Note: Face occlusion, turn-away, or lighting may be the cause.",
            severity="HIGH",
            student_id=student_id,
            student_name=student_name,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=timestamp
        )

    # 7. CAMERA_OFFLINE
    @staticmethod
    def log_camera_offline(db: Session, camera_id: str, camera_name: Optional[str] = None, timestamp: Optional[datetime] = None):
        cam_desc = camera_name or camera_id
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="CAMERA_OFFLINE",
            description=f"Camera '{cam_desc}' ({camera_id}) stopped transmitting frames/heartbeats. Classroom presence tracking paused without penalizing student attendance.",
            severity="CRITICAL",
            camera_id=camera_id,
            timestamp=timestamp
        )

    # 8. MISSING_RECOGNITION_DATA
    @staticmethod
    def log_missing_recognition_data(db: Session, class_id: str, period_id: str, camera_id: str, timestamp: Optional[datetime] = None):
        return AnomalyDetector.log_anomaly(
            db=db,
            event_type="MISSING_RECOGNITION_DATA",
            description=f"Missing recognition stream data for class {class_id} / period {period_id} on camera {camera_id}.",
            severity="HIGH",
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=timestamp
        )

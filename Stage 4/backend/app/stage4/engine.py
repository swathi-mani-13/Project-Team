from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.entities import Student, ClassPeriod, AttendanceSession, PresenceEvent, CameraStatus
from backend.app.stage4.deduplicator import deduplicator
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.stage4.presence_tracker import PresenceTracker
from backend.app.stage4.camera_health import CameraHealthService
from backend.app.stage4.schedule_engine import ScheduleEngine
from backend.app.schemas.attendance_schemas import RecognitionEventInput

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Stage4AttendanceEngine:
    """
    Main Attendance + Presence Monitoring Engine.
    Converts Stage 1-3 recognition events into validated attendance and presence states.
    """

    @staticmethod
    def process_recognition_event(
        db: Session,
        event: RecognitionEventInput
    ) -> Dict[str, Any]:
        now = event.timestamp or utc_now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")

        # 1. Update Camera Health & Frame Activity
        CameraHealthService.increment_detection_count(db=db, camera_id=event.camera_id, timestamp=now)

        # 2. Check for Unknown Face
        if not event.student_id:
            anomaly = AnomalyDetector.log_unknown_face(
                db=db,
                class_id=event.class_id,
                period_id=event.period_id,
                camera_id=event.camera_id,
                confidence=event.confidence,
                timestamp=now
            )
            return {
                "status": "ANOMALY_LOGGED",
                "reason": "UNKNOWN_FACE",
                "anomaly_id": anomaly.event_id,
                "message": "Unregistered face detected"
            }

        # 3. Check Recognition Confidence Threshold
        if event.confidence < settings.CONFIDENCE_THRESHOLD:
            anomaly = AnomalyDetector.log_low_confidence(
                db=db,
                student_id=event.student_id,
                student_name=event.student_name,
                class_id=event.class_id,
                period_id=event.period_id,
                camera_id=event.camera_id,
                confidence=event.confidence,
                threshold=settings.CONFIDENCE_THRESHOLD,
                timestamp=now
            )
            return {
                "status": "LOW_CONFIDENCE",
                "reason": "CONFIDENCE_BELOW_THRESHOLD",
                "confidence": event.confidence,
                "threshold": settings.CONFIDENCE_THRESHOLD,
                "anomaly_id": anomaly.event_id,
                "message": "Confidence below threshold; attendance not marked."
            }

        # 4. Check Sliding Window Deduplication
        if deduplicator.is_duplicate(student_id=event.student_id, camera_id=event.camera_id, current_ts=now.timestamp()):
            AnomalyDetector.log_duplicate_recognition(
                db=db,
                student_id=event.student_id,
                student_name=event.student_name,
                class_id=event.class_id,
                period_id=event.period_id,
                camera_id=event.camera_id,
                timestamp=now
            )
            return {
                "status": "DEDUPLICATED",
                "student_id": event.student_id,
                "camera_id": event.camera_id,
                "message": f"Deduplicated: multiple recognitions within {settings.RECOGNITION_DEDUPLICATION_SECONDS}s."
            }

        # 5. Check Academic Schedule & Timetable Gating (Working Day, Holiday, Break, Lunch, Closed)
        slot_info = ScheduleEngine.resolve_time_slot(db=db, target_datetime=now, class_id=event.class_id)
        
        if not slot_info["is_working_day"]:
            holiday_suffix = f" ({slot_info['holiday_name']})" if slot_info.get("holiday_name") else ""
            return {
                "status": "SCHEDULE_INACTIVE",
                "reason": slot_info["date_status"],
                "holiday_name": slot_info.get("holiday_name"),
                "student_id": event.student_id,
                "student_name": event.student_name,
                "message": f"Attendance processing paused: Today is {slot_info['date_status']}{holiday_suffix}."
            }

        if slot_info["current_schedule_type"] in ["BREAK", "LUNCH", "COLLEGE_CLOSED", "NO_ACTIVE_SLOT", "COLLEGE_START", "COLLEGE_END"]:
            return {
                "status": "SCHEDULE_INACTIVE",
                "reason": slot_info["current_schedule_type"],
                "student_id": event.student_id,
                "student_name": event.student_name,
                "message": f"Attendance processing paused: {slot_info['reason']}."
            }

        # 6. Resolve Student & Class Period Details
        student = db.query(Student).filter(Student.student_id == event.student_id).first()
        student_name = event.student_name or (student.name if student else f"Student {event.student_id}")

        if not student:
            # Auto-register student if missing in local db for seamless integration
            student = Student(
                student_id=event.student_id,
                name=student_name,
                class_id=event.class_id,
                is_active=True
            )
            db.add(student)
            db.commit()

        # Determine period_id and class timings from active slot or class_periods table
        active_slot = slot_info.get("active_slot")
        effective_period_id = active_slot.period_id if active_slot else event.period_id

        class_period = db.query(ClassPeriod).filter(
            ClassPeriod.class_id == event.class_id,
            ClassPeriod.period_id == effective_period_id,
            ClassPeriod.date == date_str
        ).first()

        if active_slot:
            class_start_str = active_slot.start_time
            class_end_str = active_slot.end_time
        elif class_period:
            class_start_str = class_period.class_start_time
            class_end_str = class_period.class_end_time
        else:
            class_start_str = "09:00:00"
            class_end_str = "10:00:00"

        # 7. Check if Attendance Session Already Exists for this Student + Period + Date
        session = db.query(AttendanceSession).filter(
            AttendanceSession.student_id == event.student_id,
            AttendanceSession.class_id == event.class_id,
            AttendanceSession.period_id == effective_period_id,
            AttendanceSession.date == date_str
        ).first()

        if session:
            # Existing Session: Check Presence Restoration or Interval Update
            was_unverified = session.presence_status in ["PRESENCE_UNVERIFIED", "PRESENCE_EXCEPTION"]
            
            if was_unverified:
                PresenceTracker.restore_presence(
                    db=db,
                    session=session,
                    detected_at=now,
                    camera_id=event.camera_id,
                    confidence=event.confidence
                )
                return {
                    "status": "PRESENCE_RESTORED",
                    "student_id": session.student_id,
                    "student_name": session.student_name,
                    "class_id": session.class_id,
                    "period_id": session.period_id,
                    "presence_status": session.presence_status,
                    "attendance_status": session.attendance_status,
                    "message": f"Presence restored for {session.student_name}."
                }
            else:
                session.last_detected_at = now
                session.presence_intervals += 1
                session.confidence = event.confidence
                
                # Check if we should log interval event
                last_event = db.query(PresenceEvent).filter(
                    PresenceEvent.session_id == session.id
                ).order_by(PresenceEvent.timestamp.desc()).first()

                if not last_event or (now - last_event.timestamp).total_seconds() >= (settings.VERIFICATION_INTERVAL_MINUTES * 60):
                    PresenceTracker._add_presence_event(
                        db=db,
                        session=session,
                        time_str=time_str,
                        event_type="PRESENCE_VERIFIED",
                        status_badge="PRESENT",
                        camera_id=event.camera_id,
                        confidence=event.confidence,
                        details="Verified present during class.",
                        timestamp=now
                    )
                db.commit()
                db.refresh(session)
                return {
                    "status": "PRESENCE_UPDATED",
                    "student_id": session.student_id,
                    "student_name": session.student_name,
                    "attendance_status": session.attendance_status,
                    "presence_status": session.presence_status,
                    "last_detected_at": session.last_detected_at.isoformat()
                }

        # 7. Initial Attendance & Late Entry Detection
        late_minutes, entry_status = Stage4AttendanceEngine.calculate_late_status(
            detection_time=now,
            class_start_str=class_start_str,
            late_threshold=settings.LATE_THRESHOLD_MINUTES
        )

        session = AttendanceSession(
            student_id=event.student_id,
            student_name=student_name,
            class_id=event.class_id,
            period_id=effective_period_id,
            date=date_str,
            camera_id=event.camera_id,
            class_start_time=class_start_str,
            class_end_time=class_end_str,
            first_detected_at=now,
            last_detected_at=now,
            attendance_status="PRESENT",
            entry_status=entry_status,
            late_minutes=late_minutes,
            presence_status="PRESENT",
            presence_intervals=1,
            missed_intervals=0,
            presence_restored=False,
            possible_exit=False,
            confidence=event.confidence,
            created_at=now,
            updated_at=now
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Log initial presence event
        badge = "LATE" if entry_status == "LATE" else "PRESENT"
        details = f"Initial detection at {time_str} ({entry_status.lower()}{f' by {late_minutes}m' if late_minutes > 0 else ''})."
        
        PresenceTracker._add_presence_event(
            db=db,
            session=session,
            time_str=time_str,
            event_type="FIRST_DETECTION",
            status_badge=badge,
            camera_id=event.camera_id,
            confidence=event.confidence,
            details=details,
            timestamp=now
        )

        # If late, log LATE_ENTRY anomaly
        if entry_status == "LATE":
            AnomalyDetector.log_late_entry(
                db=db,
                student_id=session.student_id,
                student_name=session.student_name,
                class_id=session.class_id,
                period_id=session.period_id,
                camera_id=session.camera_id,
                late_minutes=late_minutes,
                timestamp=now
            )

        db.commit()

        return {
            "status": "ATTENDANCE_RECORDED",
            "student_id": session.student_id,
            "student_name": session.student_name,
            "class_id": session.class_id,
            "period_id": session.period_id,
            "attendance_status": session.attendance_status,
            "entry_status": session.entry_status,
            "late_minutes": session.late_minutes,
            "first_detected_at": session.first_detected_at.isoformat(),
            "confidence": session.confidence,
            "message": f"Marked {session.student_name} as {session.attendance_status} ({session.entry_status})."
        }

    @staticmethod
    def calculate_late_status(
        detection_time: datetime,
        class_start_str: str,
        late_threshold: int = 5
    ) -> tuple[int, str]:
        """
        Calculates whether detection is ON_TIME or LATE.
        Detection <= class_start + threshold -> ON_TIME (late_minutes = 0)
        Detection > class_start + threshold -> LATE (late_minutes = actual delta)
        """
        try:
            start_parts = [int(p) for p in class_start_str.split(":")[:2]]
            start_hour, start_min = start_parts[0], start_parts[1]
        except Exception:
            start_hour, start_min = 9, 0

        det_hour = detection_time.hour
        det_min = detection_time.minute

        det_total_mins = det_hour * 60 + det_min
        start_total_mins = start_hour * 60 + start_min

        delta_mins = det_total_mins - start_total_mins

        if delta_mins <= late_threshold:
            return 0, "ON_TIME"
        else:
            return delta_mins, "LATE"

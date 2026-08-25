from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models.entities import AttendanceSession, PresenceEvent
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.stage4.schedule_engine import ScheduleEngine
from backend.app.config import settings

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class PresenceTracker:
    """
    Manages continuous presence verification intervals, presence restoration,
    and safe possible early exit detection.
    """

    @staticmethod
    def verify_period_presence(
        db: Session,
        class_id: str,
        period_id: str,
        detected_student_ids: List[str],
        interval_timestamp: Optional[datetime] = None,
        camera_id: Optional[str] = None
    ) -> List[AttendanceSession]:
        """
        Executes a periodic presence verification check for a class period.
        Compares expected/previously present students with students detected in this interval.
        """
        now = interval_timestamp or utc_now()
        time_str = now.strftime("%H:%M")
        date_str = now.strftime("%Y-%m-%d")
        detected_set = set(detected_student_ids)

        # Check if schedule monitoring is currently active
        slot_info = ScheduleEngine.resolve_time_slot(db=db, target_datetime=now, class_id=class_id)
        if slot_info["current_schedule_type"] in ["BREAK", "LUNCH", "COLLEGE_CLOSED", "NON_WORKING_DAY", "HOLIDAY", "WEEKEND", "NO_ACTIVE_SLOT"] and not slot_info["is_monitoring_active"]:
            # Break, lunch, closed, or holiday: skip presence verification to avoid false unverified/absence
            return db.query(AttendanceSession).filter(
                AttendanceSession.class_id == class_id,
                AttendanceSession.period_id == period_id,
                AttendanceSession.date == date_str,
                AttendanceSession.attendance_status == "PRESENT"
            ).all()

        # Get all attendance sessions for this class period today
        sessions = db.query(AttendanceSession).filter(
            AttendanceSession.class_id == class_id,
            AttendanceSession.period_id == period_id,
            AttendanceSession.date == date_str,
            AttendanceSession.attendance_status == "PRESENT"
        ).all()

        cam_id = camera_id or (sessions[0].camera_id if sessions else "CAM_01")

        for session in sessions:
            if session.student_id in detected_set:
                # Student is verified present in this interval
                if session.presence_status in ["PRESENCE_UNVERIFIED", "PRESENCE_EXCEPTION"]:
                    # Restore presence
                    PresenceTracker.restore_presence(
                        db=db,
                        session=session,
                        detected_at=now,
                        camera_id=cam_id
                    )
                else:
                    session.presence_intervals += 1
                    session.last_detected_at = now
                    # Add normal interval presence record if not duplicate for this minute
                    PresenceTracker._add_presence_event(
                        db=db,
                        session=session,
                        time_str=time_str,
                        event_type="PRESENCE_VERIFIED",
                        status_badge="PRESENT",
                        camera_id=cam_id,
                        details="Verified present during routine interval check.",
                        timestamp=now
                    )
            else:
                # Student was NOT detected in this interval
                session.missed_intervals += 1
                
                if session.missed_intervals >= settings.ABSENCE_CONFIRMATION_INTERVALS:
                    # Consecutively missed >= threshold -> PRESENCE_EXCEPTION / Possible Early Exit
                    session.presence_status = "PRESENCE_EXCEPTION"
                    session.possible_exit = True
                    PresenceTracker._add_presence_event(
                        db=db,
                        session=session,
                        time_str=time_str,
                        event_type="POSSIBLE_EARLY_EXIT",
                        status_badge="POSSIBLE EXIT",
                        camera_id=cam_id,
                        details=f"Possible early exit flagged after {session.missed_intervals} consecutive missed intervals. Occlusion or turn-away possible.",
                        timestamp=now
                    )
                    AnomalyDetector.log_possible_early_exit(
                        db=db,
                        student_id=session.student_id,
                        student_name=session.student_name,
                        class_id=session.class_id,
                        period_id=session.period_id,
                        camera_id=cam_id,
                        missed_intervals=session.missed_intervals,
                        timestamp=now
                    )
                else:
                    # Temporary missing recognition -> PRESENCE_UNVERIFIED (NOT absent)
                    session.presence_status = "PRESENCE_UNVERIFIED"
                    PresenceTracker._add_presence_event(
                        db=db,
                        session=session,
                        time_str=time_str,
                        event_type="PRESENCE_UNVERIFIED",
                        status_badge="UNVERIFIED",
                        camera_id=cam_id,
                        details=f"Presence unverified in interval {time_str}. May be turned away, occluded, or low lighting.",
                        timestamp=now
                    )
                    AnomalyDetector.log_presence_missing(
                        db=db,
                        student_id=session.student_id,
                        student_name=session.student_name,
                        class_id=session.class_id,
                        period_id=session.period_id,
                        camera_id=cam_id,
                        missed_intervals=session.missed_intervals,
                        timestamp=now
                    )

        db.commit()
        return sessions

    @staticmethod
    def restore_presence(
        db: Session,
        session: AttendanceSession,
        detected_at: datetime,
        camera_id: str,
        confidence: Optional[float] = None
    ) -> PresenceEvent:
        """
        Restores presence when a previously unverified student is detected again.
        """
        time_str = detected_at.strftime("%H:%M")
        
        # Calculate unverified duration
        if session.last_detected_at:
            unverified_mins = max(1, int((detected_at - session.last_detected_at).total_seconds() / 60))
        else:
            unverified_mins = session.missed_intervals * settings.VERIFICATION_INTERVAL_MINUTES

        session.presence_status = "PRESENCE_RESTORED"
        session.presence_restored = True
        session.possible_exit = False
        session.missed_intervals = 0
        session.last_detected_at = detected_at
        session.presence_intervals += 1
        if confidence:
            session.confidence = confidence

        details = f"Presence restored after {unverified_mins} minutes unverified."

        event = PresenceTracker._add_presence_event(
            db=db,
            session=session,
            time_str=time_str,
            event_type="PRESENCE_RESTORED",
            status_badge="RESTORED",
            camera_id=camera_id,
            confidence=confidence,
            details=details,
            timestamp=detected_at
        )
        db.commit()
        db.refresh(session)
        return event

    @staticmethod
    def _add_presence_event(
        db: Session,
        session: AttendanceSession,
        time_str: str,
        event_type: str,
        status_badge: str,
        camera_id: str,
        details: Optional[str] = None,
        confidence: Optional[float] = None,
        timestamp: Optional[datetime] = None
    ) -> PresenceEvent:
        ts = timestamp or utc_now()
        event = PresenceEvent(
            session_id=session.id,
            student_id=session.student_id,
            student_name=session.student_name,
            class_id=session.class_id,
            period_id=session.period_id,
            timestamp=ts,
            time_str=time_str,
            event_type=event_type,
            status_badge=status_badge,
            camera_id=camera_id,
            confidence=confidence or session.confidence,
            interval_index=session.presence_intervals,
            details=details
        )
        db.add(event)
        return event

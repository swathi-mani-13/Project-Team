from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index, UniqueConstraint, Text
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    class_id = Column(String(64), index=True, nullable=False)
    email = Column(String(128), nullable=True)
    roll_number = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    sessions = relationship("AttendanceSession", back_populates="student")


class ClassPeriod(Base):
    __tablename__ = "class_periods"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String(64), index=True, nullable=False)
    period_id = Column(String(64), index=True, nullable=False)
    subject = Column(String(128), nullable=False)
    teacher_name = Column(String(128), nullable=True)
    class_start_time = Column(String(32), nullable=False)  # e.g., "09:00:00"
    class_end_time = Column(String(32), nullable=False)    # e.g., "10:00:00"
    date = Column(String(32), index=True, nullable=False)  # e.g., "2026-08-25"
    camera_id = Column(String(64), index=True, nullable=False)
    is_active = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("class_id", "period_id", "date", name="uq_class_period_date"),
    )


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(64), ForeignKey("students.student_id"), index=True, nullable=False)
    student_name = Column(String(128), nullable=False)
    class_id = Column(String(64), index=True, nullable=False)
    period_id = Column(String(64), index=True, nullable=False)
    date = Column(String(32), index=True, nullable=False)
    camera_id = Column(String(64), index=True, nullable=False)
    class_start_time = Column(String(32), nullable=False)
    class_end_time = Column(String(32), nullable=False)
    
    first_detected_at = Column(DateTime, nullable=True)
    last_detected_at = Column(DateTime, nullable=True)
    
    attendance_status = Column(String(32), default="PENDING", index=True)  # PRESENT, ABSENT, PENDING
    entry_status = Column(String(32), default="ON_TIME")  # ON_TIME, LATE
    late_minutes = Column(Integer, default=0)
    
    presence_status = Column(String(32), default="PRESENT", index=True)  # PRESENT, PRESENCE_UNVERIFIED, PRESENCE_RESTORED, PRESENCE_EXCEPTION
    presence_intervals = Column(Integer, default=1)
    missed_intervals = Column(Integer, default=0)
    presence_restored = Column(Boolean, default=False)
    possible_exit = Column(Boolean, default=False)
    
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    student = relationship("Student", back_populates="sessions")
    presence_events = relationship("PresenceEvent", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("student_id", "class_id", "period_id", "date", name="uq_student_session"),
        Index("idx_att_query", "class_id", "period_id", "date"),
    )


class PresenceEvent(Base):
    __tablename__ = "presence_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    student_id = Column(String(64), index=True, nullable=False)
    student_name = Column(String(128), nullable=True)
    class_id = Column(String(64), index=True, nullable=False)
    period_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    time_str = Column(String(16), nullable=False)  # "09:00", "09:10"
    
    event_type = Column(String(64), nullable=False)  # FIRST_DETECTION, PRESENCE_VERIFIED, PRESENCE_UNVERIFIED, PRESENCE_RESTORED, PRESENCE_EXCEPTION
    status_badge = Column(String(32), nullable=False)  # PRESENT, LATE, UNVERIFIED, RESTORED, POSSIBLE EXIT
    
    camera_id = Column(String(64), index=True, nullable=False)
    confidence = Column(Float, nullable=True)
    interval_index = Column(Integer, default=0)
    details = Column(Text, nullable=True)

    session = relationship("AttendanceSession", back_populates="presence_events")

    __table_args__ = (
        Index("idx_presence_student_ts", "student_id", "timestamp"),
    )


class AttendanceAnomaly(Base):
    __tablename__ = "attendance_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    event_type = Column(String(64), index=True, nullable=False)  # UNKNOWN_FACE, LOW_CONFIDENCE, DUPLICATE_RECOGNITION, PRESENCE_MISSING, LATE_ENTRY, POSSIBLE_EARLY_EXIT, CAMERA_OFFLINE, MISSING_RECOGNITION_DATA
    student_id = Column(String(64), index=True, nullable=True)
    student_name = Column(String(128), nullable=True)
    class_id = Column(String(64), index=True, nullable=True)
    period_id = Column(String(64), nullable=True)
    camera_id = Column(String(64), index=True, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    confidence = Column(Float, nullable=True)
    severity = Column(String(32), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(128), nullable=True)


class CameraStatus(Base):
    __tablename__ = "camera_statuses"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    location = Column(String(128), nullable=False)
    status = Column(String(32), default="ONLINE", index=True)  # ONLINE, OFFLINE, DEGRADED
    last_heartbeat = Column(DateTime, default=utc_now, index=True)
    last_frame_processed_at = Column(DateTime, default=utc_now)
    total_detections_today = Column(Integer, default=0)
    fps = Column(Float, default=30.0)


class AcademicSchedule(Base):
    __tablename__ = "academic_schedules"

    id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String(64), nullable=False, default="2026-2027")  # e.g., "2026-2027"
    semester = Column(String(64), nullable=False, default="Odd Semester (Autumn 2026)")
    start_date = Column(String(32), nullable=False, default="2026-08-01")   # YYYY-MM-DD
    end_date = Column(String(32), nullable=False, default="2026-12-31")     # YYYY-MM-DD
    college_open_time = Column(String(32), nullable=False, default="09:00:00")  # HH:MM:SS
    college_close_time = Column(String(32), nullable=False, default="16:30:00") # HH:MM:SS
    timezone = Column(String(64), nullable=False, default="Asia/Kolkata")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class WeeklyWorkingDay(Base):
    __tablename__ = "weekly_working_days"

    id = Column(Integer, primary_key=True, index=True)
    day_index = Column(Integer, unique=True, nullable=False)  # 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    day_name = Column(String(32), nullable=False)             # "Monday", "Tuesday", ...
    is_working_day = Column(Boolean, default=True, nullable=False)
    custom_open_time = Column(String(32), nullable=True)      # optional custom timing for day
    custom_close_time = Column(String(32), nullable=True)


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String(64), index=True, default="CS101", nullable=False) # specific class or "*" for all
    period_id = Column(String(64), index=True, nullable=False)                  # "P1", "P2", "BREAK_1", "LUNCH", "P5"
    name = Column(String(128), nullable=False)                                  # "Period 1", "Short Break", "Lunch Break"
    slot_type = Column(String(32), index=True, nullable=False)                 # CLASS, BREAK, LUNCH, COLLEGE_START, COLLEGE_END
    start_time = Column(String(32), nullable=False)                            # "09:00:00"
    end_time = Column(String(32), nullable=False)                              # "09:50:00"
    order_index = Column(Integer, default=0, nullable=False)
    subject = Column(String(128), nullable=True)                               # e.g., "Artificial Intelligence"
    teacher_name = Column(String(128), nullable=True)
    camera_id = Column(String(64), default="CAM_01", nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_slot_class_order", "class_id", "order_index"),
    )


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)                                  # "Independence Day", "Pongal Holidays"
    start_date = Column(String(32), index=True, nullable=False)                # "2026-08-15" (YYYY-MM-DD)
    end_date = Column(String(32), index=True, nullable=False)                  # "2026-08-15" or "2027-01-17"
    holiday_type = Column(String(64), default="NATIONAL", nullable=False)      # NATIONAL, COLLEGE, FESTIVAL, EXAM_BREAK, OTHER
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class SpecialDateOverride(Base):
    __tablename__ = "special_date_overrides"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(32), unique=True, index=True, nullable=False)          # "2026-08-29" (YYYY-MM-DD)
    is_working_day = Column(Boolean, default=True, nullable=False)              # True = Special Working Day, False = Special Holiday
    reason = Column(String(256), nullable=False)                                # "Compensatory working day for festival"
    apply_timetable = Column(String(64), default="DEFAULT", nullable=False)     # "DEFAULT" or "SPECIAL" or "FRIDAY"
    created_at = Column(DateTime, default=utc_now)


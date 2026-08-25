from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

# --- Ingestion Schemas ---

class RecognitionEventInput(BaseModel):
    student_id: Optional[str] = Field(None, description="Identified Student ID or null if unknown face")
    student_name: Optional[str] = Field(None, description="Student name if available from Stage 3")
    class_id: str = Field(..., description="Target Class ID")
    period_id: str = Field(..., description="Target Class Period ID")
    camera_id: str = Field(..., description="Camera ID that captured the frame")
    timestamp: Optional[datetime] = Field(default_factory=utc_now, description="Detection timestamp")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Face recognition confidence from Stage 3")
    bbox: Optional[List[int]] = Field(None, description="Bounding box [x, y, w, h] from Stage 2")
    face_id: Optional[str] = Field(None, description="Face tracking ID from Stage 2")

class PresenceVerificationInput(BaseModel):
    class_id: str = Field(..., description="Target Class ID")
    period_id: str = Field(..., description="Target Class Period ID")
    date: Optional[str] = Field(None, description="Date YYYY-MM-DD")
    interval_timestamp: Optional[datetime] = Field(default_factory=utc_now, description="Interval checkpoint time")

class CameraHeartbeatInput(BaseModel):
    camera_id: str
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "ONLINE"
    fps: Optional[float] = 30.0

class AnomalyResolveInput(BaseModel):
    resolved_by: str = "Admin"
    notes: Optional[str] = None

# --- Output Schemas ---

class PresenceEventSchema(BaseModel):
    id: int
    time_str: str
    timestamp: datetime
    event_type: str
    status_badge: str
    camera_id: str
    confidence: Optional[float] = None
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AttendanceSessionSchema(BaseModel):
    id: int
    student_id: str
    student_name: str
    class_id: str
    period_id: str
    date: str
    camera_id: str
    class_start_time: str
    class_end_time: str
    first_detected_at: Optional[datetime] = None
    last_detected_at: Optional[datetime] = None
    attendance_status: str
    entry_status: str
    late_minutes: int
    presence_status: str
    presence_intervals: int
    missed_intervals: int
    presence_restored: bool
    possible_exit: bool
    confidence: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentTimelineResponse(BaseModel):
    student_id: str
    student_name: str
    class_id: str
    period_id: str
    date: str
    attendance_status: str
    entry_status: str
    late_minutes: int
    current_presence_status: str
    possible_exit: bool
    first_detected_at: Optional[datetime] = None
    last_detected_at: Optional[datetime] = None
    timeline: List[PresenceEventSchema]

class AttendancePercentageResponse(BaseModel):
    student_id: str
    student_name: str
    class_id: str
    present_days: int
    working_days: int
    attendance_percentage: float
    status_classification: str  # GOOD, WARNING, CRITICAL
    threshold_good: float
    threshold_warning: float

class AttendanceSummaryResponse(BaseModel):
    class_id: str
    period_id: str
    date: str
    total_students: int
    present_count: int
    late_count: int
    presence_unverified_count: int
    possible_exit_count: int
    unknown_faces_count: int
    camera_status: str
    average_attendance_percentage: float
    students: List[AttendanceSessionSchema]

class AttendanceAnomalySchema(BaseModel):
    id: int
    event_id: str
    event_type: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    class_id: Optional[str] = None
    period_id: Optional[str] = None
    camera_id: Optional[str] = None
    timestamp: datetime
    confidence: Optional[float] = None
    severity: str
    description: str
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CameraStatusSchema(BaseModel):
    camera_id: str
    name: str
    location: str
    status: str
    last_heartbeat: datetime
    last_frame_processed_at: datetime
    total_detections_today: int
    fps: float

    model_config = ConfigDict(from_attributes=True)

class ConfigUpdateSchema(BaseModel):
    late_threshold_minutes: Optional[int] = None
    verification_interval_minutes: Optional[int] = None
    absence_confirmation_intervals: Optional[int] = None
    recognition_deduplication_seconds: Optional[int] = None
    confidence_threshold: Optional[float] = None
    camera_timeout_seconds: Optional[int] = None
    attendance_good_threshold: Optional[float] = None
    attendance_warning_threshold: Optional[float] = None

# --- Schedule & Calendar Schemas ---

class AcademicScheduleSchema(BaseModel):
    id: int
    academic_year: str
    semester: str
    start_date: str
    end_date: str
    college_open_time: str
    college_close_time: str
    timezone: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class AcademicScheduleUpdate(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    college_open_time: Optional[str] = None
    college_close_time: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None

class WeeklyWorkingDaySchema(BaseModel):
    id: int
    day_index: int
    day_name: str
    is_working_day: bool
    custom_open_time: Optional[str] = None
    custom_close_time: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class WeeklyWorkingDayUpdate(BaseModel):
    is_working_day: bool
    custom_open_time: Optional[str] = None
    custom_close_time: Optional[str] = None

class ScheduleSlotSchema(BaseModel):
    id: int
    class_id: str
    period_id: str
    name: str
    slot_type: str  # CLASS, BREAK, LUNCH, COLLEGE_START, COLLEGE_END
    start_time: str
    end_time: str
    order_index: int
    subject: Optional[str] = None
    teacher_name: Optional[str] = None
    camera_id: Optional[str] = "CAM_01"
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ScheduleSlotCreate(BaseModel):
    class_id: str = "CS101"
    period_id: str
    name: str
    slot_type: str  # CLASS, BREAK, LUNCH, COLLEGE_START, COLLEGE_END
    start_time: str # "09:00:00" or "09:00"
    end_time: str   # "09:50:00" or "09:50"
    order_index: Optional[int] = 0
    subject: Optional[str] = None
    teacher_name: Optional[str] = None
    camera_id: Optional[str] = "CAM_01"
    is_active: Optional[bool] = True

class ScheduleSlotUpdate(BaseModel):
    class_id: Optional[str] = None
    period_id: Optional[str] = None
    name: Optional[str] = None
    slot_type: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    order_index: Optional[int] = None
    subject: Optional[str] = None
    teacher_name: Optional[str] = None
    camera_id: Optional[str] = None
    is_active: Optional[bool] = None

class HolidaySchema(BaseModel):
    id: int
    name: str
    start_date: str
    end_date: str
    holiday_type: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class HolidayCreate(BaseModel):
    name: str
    start_date: str # "YYYY-MM-DD"
    end_date: Optional[str] = None # Defaults to start_date
    holiday_type: Optional[str] = "NATIONAL"
    description: Optional[str] = None

class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    holiday_type: Optional[str] = None
    description: Optional[str] = None

class SpecialDateOverrideSchema(BaseModel):
    id: int
    date: str
    is_working_day: bool
    reason: str
    apply_timetable: str

    model_config = ConfigDict(from_attributes=True)

class SpecialDateOverrideCreate(BaseModel):
    date: str
    is_working_day: bool = True
    reason: str
    apply_timetable: Optional[str] = "DEFAULT"

class DayScheduleStatusResponse(BaseModel):
    date: str
    day_name: str
    date_status: str  # WORKING_DAY, HOLIDAY, WEEKEND, SPECIAL_WORKING_DAY, NON_WORKING_DAY
    is_working_day: bool
    holiday_name: Optional[str] = None
    override_reason: Optional[str] = None
    college_open_time: str
    college_close_time: str
    current_time_ist: Optional[str] = None
    current_slot: Optional[ScheduleSlotSchema] = None
    current_schedule_type: Optional[str] = None # CLASS, BREAK, LUNCH, COLLEGE_CLOSED, NO_ACTIVE_SLOT
    timetable: List[ScheduleSlotSchema]

class MonthlyAttendanceDay(BaseModel):
    date: str
    day_number: int
    day_name: str
    date_status: str       # WORKING_DAY, HOLIDAY, WEEKEND, SPECIAL_WORKING_DAY
    is_working_day: bool
    holiday_name: Optional[str] = None
    attendance_status: Optional[str] = None  # PRESENT, ABSENT, NOT_SCHEDULED
    entry_status: Optional[str] = None       # ON_TIME, LATE, NOT_ARRIVED
    late_minutes: int = 0
    presence_status: Optional[str] = None
    possible_exit: bool = False

class MonthlyAttendanceResponse(BaseModel):
    student_id: str
    student_name: str
    class_id: str
    year: int
    month: int
    month_name: str
    total_calendar_days: int
    total_working_days: int
    total_holidays: int
    total_weekends: int
    present_days: int
    absent_days: int
    late_days: int
    presence_exceptions: int
    attendance_percentage: float
    status_classification: str
    days: List[MonthlyAttendanceDay]


import calendar
from datetime import datetime, timezone, timedelta, date as ddate
from typing import Dict, Any, Optional, List, Tuple
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.app.models.entities import (
    AcademicSchedule, WeeklyWorkingDay, ScheduleSlot, Holiday, SpecialDateOverride,
    AttendanceSession, Student, ClassPeriod
)
from backend.app.stage4.metrics import MetricsCalculator

DEFAULT_TIMEZONE_STR = "Asia/Kolkata"

def get_tz() -> ZoneInfo:
    try:
        return ZoneInfo(DEFAULT_TIMEZONE_STR)
    except Exception:
        return timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    tz = get_tz()
    return datetime.now(tz)

def to_ist_datetime(dt: Optional[datetime]) -> datetime:
    if dt is None:
        return get_ist_now()
    if dt.tzinfo is None:
        # Naive datetime represents wall-clock time in local timezone (Asia/Kolkata)
        return dt.replace(tzinfo=get_tz())
    return dt.astimezone(get_tz())

def time_to_seconds(time_str: str) -> int:
    parts = [int(p) for p in time_str.split(":")]
    if len(parts) == 2:
        return parts[0] * 3600 + parts[1] * 60
    elif len(parts) >= 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0

def format_time_str(time_str: str) -> str:
    """Normalizes time string to HH:MM:SS format."""
    parts = time_str.strip().split(":")
    if len(parts) == 2:
        return f"{int(parts[0]):02d}:{int(parts[1]):02d}:00"
    elif len(parts) >= 3:
        return f"{int(parts[0]):02d}:{int(parts[1]):02d}:{int(parts[2]):02d}"
    return time_str


class ScheduleEngine:
    """
    Intelligent Academic Schedule, Timetable, Break, Working-Day & Holiday Engine.
    Enforces that attendance and presence monitoring strictly adhere to configured schedules.
    """

    @staticmethod
    def get_or_create_academic_schedule(db: Session) -> AcademicSchedule:
        sched = db.query(AcademicSchedule).filter(AcademicSchedule.is_active == True).first()
        if not sched:
            sched = AcademicSchedule(
                academic_year="2026-2027",
                semester="Odd Semester (Autumn 2026)",
                start_date="2026-08-01",
                end_date="2026-12-31",
                college_open_time="09:00:00",
                college_close_time="16:30:00",
                timezone=DEFAULT_TIMEZONE_STR,
                is_active=True
            )
            db.add(sched)
            db.commit()
            db.refresh(sched)
        return sched

    @staticmethod
    def get_weekly_working_days(db: Session) -> List[WeeklyWorkingDay]:
        days = db.query(WeeklyWorkingDay).order_by(WeeklyWorkingDay.day_index.asc()).all()
        if not days:
            # Initialize defaults: Mon-Fri working, Sat-Sun holiday
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            default_days = []
            for idx, name in enumerate(day_names):
                is_working = idx < 5  # Mon-Fri
                d = WeeklyWorkingDay(day_index=idx, day_name=name, is_working_day=is_working)
                default_days.append(d)
            db.add_all(default_days)
            db.commit()
            days = db.query(WeeklyWorkingDay).order_by(WeeklyWorkingDay.day_index.asc()).all()
        return days

    @staticmethod
    def resolve_date_status(db: Session, target_date_str: str) -> Dict[str, Any]:
        """
        Determines the calendar status for a specific date (YYYY-MM-DD):
        - SPECIAL_WORKING_DAY (explicit override)
        - HOLIDAY (explicit holiday or date-range holiday or special holiday override)
        - WEEKEND (configured non-working weekend like Sunday or non-working Saturday)
        - WORKING_DAY (standard weekly working day)
        - NON_WORKING_DAY (configured non-working weekday)
        """
        try:
            target_dt = datetime.strptime(target_date_str, "%Y-%m-%d")
        except ValueError:
            target_dt = datetime.utcnow()
            target_date_str = target_dt.strftime("%Y-%m-%d")

        day_idx = target_dt.weekday()  # 0=Monday, ..., 6=Sunday
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_name = day_names[day_idx]

        # 1. Check Special Date Overrides first
        special_override = db.query(SpecialDateOverride).filter(SpecialDateOverride.date == target_date_str).first()
        if special_override:
            if special_override.is_working_day:
                return {
                    "date": target_date_str,
                    "day_name": day_name,
                    "date_status": "SPECIAL_WORKING_DAY",
                    "is_working_day": True,
                    "holiday_name": None,
                    "override_reason": special_override.reason,
                    "apply_timetable": special_override.apply_timetable
                }
            else:
                return {
                    "date": target_date_str,
                    "day_name": day_name,
                    "date_status": "HOLIDAY",
                    "is_working_day": False,
                    "holiday_name": special_override.reason,
                    "override_reason": special_override.reason,
                    "apply_timetable": "NONE"
                }

        # 2. Check Holiday Calendar (Single and Multi-Date Range)
        holidays = db.query(Holiday).filter(
            Holiday.start_date <= target_date_str,
            Holiday.end_date >= target_date_str
        ).all()
        if holidays:
            h = holidays[0]
            return {
                "date": target_date_str,
                "day_name": day_name,
                "date_status": "HOLIDAY",
                "is_working_day": False,
                "holiday_name": h.name,
                "override_reason": h.description or h.name,
                "apply_timetable": "NONE"
            }

        # 3. Check Weekly Working Day status
        weekly_day = db.query(WeeklyWorkingDay).filter(WeeklyWorkingDay.day_index == day_idx).first()
        is_weekly_working = weekly_day.is_working_day if weekly_day else (day_idx < 5)

        if not is_weekly_working:
            date_status = "WEEKEND" if day_idx in [5, 6] else "NON_WORKING_DAY"
            return {
                "date": target_date_str,
                "day_name": day_name,
                "date_status": date_status,
                "is_working_day": False,
                "holiday_name": None,
                "override_reason": f"Regular {day_name} ({date_status})",
                "apply_timetable": "NONE"
            }

        return {
            "date": target_date_str,
            "day_name": day_name,
            "date_status": "WORKING_DAY",
            "is_working_day": True,
            "holiday_name": None,
            "override_reason": None,
            "apply_timetable": "DEFAULT"
        }

    @staticmethod
    def get_timetable_for_date(db: Session, date_str: str, class_id: str = "CS101") -> List[ScheduleSlot]:
        slots = db.query(ScheduleSlot).filter(
            or_(ScheduleSlot.class_id == class_id, ScheduleSlot.class_id == "*"),
            ScheduleSlot.is_active == True
        ).order_by(ScheduleSlot.order_index.asc(), ScheduleSlot.start_time.asc()).all()

        if not slots:
            # Fallback to ClassPeriod entities if defined in DB for backwards compatibility
            class_periods = db.query(ClassPeriod).filter(
                ClassPeriod.class_id == class_id,
                ClassPeriod.date == date_str,
                ClassPeriod.is_active == True
            ).all()
            if class_periods:
                for cp in class_periods:
                    s = ScheduleSlot(
                        class_id=cp.class_id,
                        period_id=cp.period_id,
                        name=f"Period {cp.period_id}",
                        slot_type="CLASS",
                        start_time=cp.class_start_time,
                        end_time=cp.class_end_time,
                        order_index=1,
                        subject=cp.subject,
                        teacher_name=cp.teacher_name,
                        camera_id=cp.camera_id,
                        is_active=True
                    )
                    db.add(s)
                db.commit()
                slots = db.query(ScheduleSlot).filter(
                    or_(ScheduleSlot.class_id == class_id, ScheduleSlot.class_id == "*"),
                    ScheduleSlot.is_active == True
                ).order_by(ScheduleSlot.order_index.asc(), ScheduleSlot.start_time.asc()).all()

        return slots

    @staticmethod
    def resolve_time_slot(
        db: Session,
        target_datetime: Optional[datetime] = None,
        class_id: str = "CS101",
        date_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full schedule slot evaluator for a given moment in time (IST):
        Returns:
        - date_status: WORKING_DAY, HOLIDAY, WEEKEND, etc.
        - current_schedule_type: CLASS, BREAK, LUNCH, COLLEGE_CLOSED, NO_ACTIVE_SLOT, NON_WORKING_DAY
        - is_monitoring_active: True ONLY when date is working and current_schedule_type == 'CLASS'
        - active_slot: matched ScheduleSlot or None
        """
        ist_dt = to_ist_datetime(target_datetime)
        date_str = date_override or ist_dt.strftime("%Y-%m-%d")
        time_str = ist_dt.strftime("%H:%M:%S")

        # 1. Resolve date status
        date_info = ScheduleEngine.resolve_date_status(db=db, target_date_str=date_str)
        if not date_info["is_working_day"]:
            return {
                **date_info,
                "current_time_ist": time_str,
                "current_schedule_type": "NON_WORKING_DAY",
                "is_monitoring_active": False,
                "active_slot": None,
                "reason": f"Schedule inactive: {date_info['date_status']} ({date_info['holiday_name'] or date_info['day_name']})"
            }

        # 2. Check College Hours
        schedule_config = ScheduleEngine.get_or_create_academic_schedule(db=db)
        open_sec = time_to_seconds(schedule_config.college_open_time)
        close_sec = time_to_seconds(schedule_config.college_close_time)
        curr_sec = time_to_seconds(time_str)

        if curr_sec < open_sec or curr_sec >= close_sec:
            return {
                **date_info,
                "current_time_ist": time_str,
                "current_schedule_type": "COLLEGE_CLOSED",
                "is_monitoring_active": False,
                "active_slot": None,
                "reason": f"College is closed (Operating hours: {schedule_config.college_open_time[:5]} – {schedule_config.college_close_time[:5]})"
            }

        # 3. Find matching timetable slot
        slots = ScheduleEngine.get_timetable_for_date(db=db, date_str=date_str, class_id=class_id)
        matched_slot = None

        for s in slots:
            s_start = time_to_seconds(s.start_time)
            s_end = time_to_seconds(s.end_time)
            if s_start <= curr_sec < s_end:
                matched_slot = s
                break

        if not matched_slot:
            return {
                **date_info,
                "current_time_ist": time_str,
                "current_schedule_type": "NO_ACTIVE_SLOT",
                "is_monitoring_active": False,
                "active_slot": None,
                "reason": "No active class or break slot defined for current time"
            }

        slot_type = matched_slot.slot_type.upper()
        is_class = (slot_type == "CLASS")

        return {
            **date_info,
            "current_time_ist": time_str,
            "current_schedule_type": slot_type,
            "is_monitoring_active": is_class,
            "active_slot": matched_slot,
            "reason": f"Currently inside {matched_slot.name} ({slot_type})"
        }

    @staticmethod
    def validate_slots_no_overlap(
        db: Session,
        class_id: str,
        start_time_str: str,
        end_time_str: str,
        exclude_slot_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates that a timetable slot:
        1. End time is strictly after start time.
        2. Does not overlap with existing active slots for the same class.
        """
        start_sec = time_to_seconds(start_time_str)
        end_sec = time_to_seconds(end_time_str)

        if end_sec <= start_sec:
            return False, f"End time ({end_time_str}) must be after start time ({start_time_str})."

        existing_slots = db.query(ScheduleSlot).filter(
            or_(ScheduleSlot.class_id == class_id, ScheduleSlot.class_id == "*"),
            ScheduleSlot.is_active == True
        )
        if exclude_slot_id:
            existing_slots = existing_slots.filter(ScheduleSlot.id != exclude_slot_id)

        for s in existing_slots.all():
            s_start = time_to_seconds(s.start_time)
            s_end = time_to_seconds(s.end_time)

            # Check overlap: (StartA < EndB) and (EndA > StartB)
            if start_sec < s_end and end_sec > s_start:
                return False, f"Schedule slot ({start_time_str} - {end_time_str}) overlaps with existing slot '{s.name}' ({s.start_time[:5]} - {s.end_time[:5]})."

        return True, None

    @staticmethod
    def calculate_monthly_attendance(
        db: Session,
        year: int,
        month: int,
        student_id: str,
        class_id: str = "CS101"
    ) -> Dict[str, Any]:
        """
        Calculates accurate monthly attendance by rigorously evaluating every calendar day:
        - Accurately identifies Working Days (excluding Sundays, non-working Saturdays, holidays)
        - Computes Present Days, Absent Days, Late Days, and Attendance %
        """
        student = db.query(Student).filter(Student.student_id == student_id).first()
        student_name = student.name if student else f"Student {student_id}"

        num_days = calendar.monthrange(year, month)[1]
        month_name = calendar.month_name[month]

        day_items = []
        total_working_days = 0
        total_holidays = 0
        total_weekends = 0
        present_days = 0
        absent_days = 0
        late_days = 0
        presence_exceptions = 0

        # Query all attendance sessions for student in this month
        month_prefix = f"{year:04d}-{month:02d}"
        sessions = db.query(AttendanceSession).filter(
            AttendanceSession.student_id == student_id,
            AttendanceSession.date.like(f"{month_prefix}-%")
        ).all()
        session_by_date = {s.date: s for s in sessions}

        for day_num in range(1, num_days + 1):
            date_str = f"{year:04d}-{month:02d}-{day_num:02d}"
            date_info = ScheduleEngine.resolve_date_status(db=db, target_date_str=date_str)
            
            sess = session_by_date.get(date_str)

            if date_info["is_working_day"]:
                total_working_days += 1
                if sess and sess.attendance_status == "PRESENT":
                    present_days += 1
                    att_status = "PRESENT"
                    ent_status = sess.entry_status
                    late_min = sess.late_minutes
                    pres_status = sess.presence_status
                    poss_exit = sess.possible_exit
                    if sess.entry_status == "LATE":
                        late_days += 1
                    if sess.possible_exit or sess.presence_status == "PRESENCE_EXCEPTION":
                        presence_exceptions += 1
                else:
                    # On a working day without attendance marked
                    # If date is in the past, consider absent; if future/today consider pending/not scheduled
                    today_str = get_ist_now().strftime("%Y-%m-%d")
                    if date_str < today_str:
                        absent_days += 1
                        att_status = "ABSENT"
                        ent_status = "NOT_ARRIVED"
                    elif date_str == today_str and sess:
                        att_status = sess.attendance_status
                        ent_status = sess.entry_status
                    else:
                        att_status = "PENDING"
                        ent_status = "SCHEDULED"
                    late_min = 0
                    pres_status = "ABSENT" if att_status == "ABSENT" else "PENDING"
                    poss_exit = False
            else:
                att_status = "NOT_SCHEDULED"
                ent_status = "NOT_SCHEDULED"
                late_min = 0
                pres_status = "NOT_SCHEDULED"
                poss_exit = False
                if date_info["date_status"] == "HOLIDAY":
                    total_holidays += 1
                elif date_info["date_status"] in ["WEEKEND", "NON_WORKING_DAY"]:
                    total_weekends += 1

            day_items.append({
                "date": date_str,
                "day_number": day_num,
                "day_name": date_info["day_name"],
                "date_status": date_info["date_status"],
                "is_working_day": date_info["is_working_day"],
                "holiday_name": date_info["holiday_name"],
                "attendance_status": att_status,
                "entry_status": ent_status,
                "late_minutes": late_min,
                "presence_status": pres_status,
                "possible_exit": poss_exit
            })

        if total_working_days > 0:
            percentage = round((present_days / total_working_days) * 100, 2)
        else:
            percentage = 100.0

        classification = MetricsCalculator.classify_percentage(percentage)

        return {
            "student_id": student_id,
            "student_name": student_name,
            "class_id": class_id,
            "year": year,
            "month": month,
            "month_name": month_name,
            "total_calendar_days": num_days,
            "total_working_days": total_working_days,
            "total_holidays": total_holidays,
            "total_weekends": total_weekends,
            "present_days": present_days,
            "absent_days": absent_days,
            "late_days": late_days,
            "presence_exceptions": presence_exceptions,
            "attendance_percentage": percentage,
            "status_classification": classification,
            "days": day_items
        }

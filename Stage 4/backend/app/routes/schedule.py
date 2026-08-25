from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import (
    AcademicSchedule, WeeklyWorkingDay, ScheduleSlot, Holiday, SpecialDateOverride
)
from backend.app.schemas.attendance_schemas import (
    AcademicScheduleSchema,
    AcademicScheduleUpdate,
    WeeklyWorkingDaySchema,
    WeeklyWorkingDayUpdate,
    ScheduleSlotSchema,
    ScheduleSlotCreate,
    ScheduleSlotUpdate,
    HolidaySchema,
    HolidayCreate,
    HolidayUpdate,
    SpecialDateOverrideSchema,
    SpecialDateOverrideCreate,
    DayScheduleStatusResponse,
    MonthlyAttendanceResponse
)
from backend.app.stage4.schedule_engine import (
    ScheduleEngine, get_ist_now, to_ist_datetime, format_time_str
)

router = APIRouter(prefix="/api/schedule", tags=["Academic Schedule & Timetable Engine"])

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# 1. Current Schedule Status
@router.get("/current", response_model=DayScheduleStatusResponse, summary="Get real-time schedule status and active slot")
def get_current_schedule(class_id: str = "CS101", db: Session = Depends(get_db)):
    ist_now = get_ist_now()
    today_str = ist_now.strftime("%Y-%m-%d")
    slot_info = ScheduleEngine.resolve_time_slot(db=db, target_datetime=ist_now, class_id=class_id)
    timetable_slots = ScheduleEngine.get_timetable_for_date(db=db, date_str=today_str, class_id=class_id)
    sched = ScheduleEngine.get_or_create_academic_schedule(db=db)

    return DayScheduleStatusResponse(
        date=today_str,
        day_name=slot_info["day_name"],
        date_status=slot_info["date_status"],
        is_working_day=slot_info["is_working_day"],
        holiday_name=slot_info.get("holiday_name"),
        override_reason=slot_info.get("override_reason"),
        college_open_time=sched.college_open_time,
        college_close_time=sched.college_close_time,
        current_time_ist=slot_info["current_time_ist"],
        current_slot=ScheduleSlotSchema.model_validate(slot_info["active_slot"]) if slot_info.get("active_slot") else None,
        current_schedule_type=slot_info["current_schedule_type"],
        timetable=[ScheduleSlotSchema.model_validate(s) for s in timetable_slots]
    )


# 2. Today's Timetable & Schedule
@router.get("/today", response_model=DayScheduleStatusResponse, summary="Get today's timetable and status")
def get_today_schedule(class_id: str = "CS101", db: Session = Depends(get_db)):
    ist_now = get_ist_now()
    today_str = ist_now.strftime("%Y-%m-%d")
    return get_schedule_by_date(date_str=today_str, class_id=class_id, db=db)


# 3. Schedule for Specific Date
@router.get("/date/{date_str}", response_model=DayScheduleStatusResponse, summary="Get schedule and status for any date")
def get_schedule_by_date(date_str: str, class_id: str = "CS101", db: Session = Depends(get_db)):
    date_info = ScheduleEngine.resolve_date_status(db=db, target_date_str=date_str)
    timetable_slots = ScheduleEngine.get_timetable_for_date(db=db, date_str=date_str, class_id=class_id)
    sched = ScheduleEngine.get_or_create_academic_schedule(db=db)
    ist_now = get_ist_now()
    slot_info = ScheduleEngine.resolve_time_slot(db=db, target_datetime=ist_now, class_id=class_id, date_override=date_str)

    return DayScheduleStatusResponse(
        date=date_str,
        day_name=date_info["day_name"],
        date_status=date_info["date_status"],
        is_working_day=date_info["is_working_day"],
        holiday_name=date_info.get("holiday_name"),
        override_reason=date_info.get("override_reason"),
        college_open_time=sched.college_open_time,
        college_close_time=sched.college_close_time,
        current_time_ist=slot_info.get("current_time_ist"),
        current_slot=ScheduleSlotSchema.model_validate(slot_info["active_slot"]) if slot_info.get("active_slot") else None,
        current_schedule_type=slot_info.get("current_schedule_type"),
        timetable=[ScheduleSlotSchema.model_validate(s) for s in timetable_slots]
    )


# 4. Academic Calendar Settings (Year, Semester, Open/Close Times)
@router.get("/academic-calendar", response_model=AcademicScheduleSchema, summary="Get academic calendar configuration")
def get_academic_calendar(db: Session = Depends(get_db)):
    return ScheduleEngine.get_or_create_academic_schedule(db=db)

@router.put("/academic-calendar", response_model=AcademicScheduleSchema, summary="Update academic calendar configuration")
def update_academic_calendar(payload: AcademicScheduleUpdate, db: Session = Depends(get_db)):
    sched = ScheduleEngine.get_or_create_academic_schedule(db=db)
    if payload.academic_year is not None:
        sched.academic_year = payload.academic_year
    if payload.semester is not None:
        sched.semester = payload.semester
    if payload.start_date is not None:
        sched.start_date = payload.start_date
    if payload.end_date is not None:
        sched.end_date = payload.end_date
    if payload.college_open_time is not None:
        sched.college_open_time = format_time_str(payload.college_open_time)
    if payload.college_close_time is not None:
        sched.college_close_time = format_time_str(payload.college_close_time)
    if payload.timezone is not None:
        sched.timezone = payload.timezone
    if payload.is_active is not None:
        sched.is_active = payload.is_active

    db.commit()
    db.refresh(sched)
    return sched


# 5. Weekly Working Days Configuration
@router.get("/weekly-working-days", response_model=List[WeeklyWorkingDaySchema], summary="Get weekly working day rules")
def get_weekly_working_days(db: Session = Depends(get_db)):
    return ScheduleEngine.get_weekly_working_days(db=db)

@router.put("/weekly-working-days/{day_index}", response_model=WeeklyWorkingDaySchema, summary="Update working day status for specific day (0=Mon...6=Sun)")
def update_weekly_working_day(day_index: int, payload: WeeklyWorkingDayUpdate, db: Session = Depends(get_db)):
    day = db.query(WeeklyWorkingDay).filter(WeeklyWorkingDay.day_index == day_index).first()
    if not day:
        raise HTTPException(status_code=404, detail=f"Day index {day_index} not found (must be 0 to 6)")

    day.is_working_day = payload.is_working_day
    if payload.custom_open_time is not None:
        day.custom_open_time = format_time_str(payload.custom_open_time)
    if payload.custom_close_time is not None:
        day.custom_close_time = format_time_str(payload.custom_close_time)

    db.commit()
    db.refresh(day)
    return day


# 6. Timetable Periods & Breaks Management
@router.get("/periods", response_model=List[ScheduleSlotSchema], summary="Get all timetable slots (periods, breaks, lunch)")
def get_schedule_periods(class_id: str = "CS101", db: Session = Depends(get_db)):
    return ScheduleEngine.get_timetable_for_date(db=db, date_str="2026-08-25", class_id=class_id)

@router.post("/periods", response_model=ScheduleSlotSchema, summary="Add new period, break, or lunch slot")
def create_schedule_period(payload: ScheduleSlotCreate, db: Session = Depends(get_db)):
    start_fmt = format_time_str(payload.start_time)
    end_fmt = format_time_str(payload.end_time)

    # Validate non-overlapping slots
    valid, err_msg = ScheduleEngine.validate_slots_no_overlap(
        db=db,
        class_id=payload.class_id,
        start_time_str=start_fmt,
        end_time_str=end_fmt
    )
    if not valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # Calculate next order index if not provided
    if not payload.order_index:
        max_order = db.query(ScheduleSlot).filter(ScheduleSlot.class_id == payload.class_id).count()
        order_idx = max_order + 1
    else:
        order_idx = payload.order_index

    slot = ScheduleSlot(
        class_id=payload.class_id,
        period_id=payload.period_id,
        name=payload.name,
        slot_type=payload.slot_type.upper(),
        start_time=start_fmt,
        end_time=end_fmt,
        order_index=order_idx,
        subject=payload.subject,
        teacher_name=payload.teacher_name,
        camera_id=payload.camera_id or "CAM_01",
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot

@router.put("/periods/{slot_id}", response_model=ScheduleSlotSchema, summary="Edit timetable period or break")
def update_schedule_period(slot_id: int, payload: ScheduleSlotUpdate, db: Session = Depends(get_db)):
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Schedule slot not found")

    target_class = payload.class_id or slot.class_id
    start_fmt = format_time_str(payload.start_time) if payload.start_time else slot.start_time
    end_fmt = format_time_str(payload.end_time) if payload.end_time else slot.end_time

    # Validate non-overlapping
    valid, err_msg = ScheduleEngine.validate_slots_no_overlap(
        db=db,
        class_id=target_class,
        start_time_str=start_fmt,
        end_time_str=end_fmt,
        exclude_slot_id=slot_id
    )
    if not valid:
        raise HTTPException(status_code=400, detail=err_msg)

    if payload.class_id is not None:
        slot.class_id = payload.class_id
    if payload.period_id is not None:
        slot.period_id = payload.period_id
    if payload.name is not None:
        slot.name = payload.name
    if payload.slot_type is not None:
        slot.slot_type = payload.slot_type.upper()
    if payload.start_time is not None:
        slot.start_time = start_fmt
    if payload.end_time is not None:
        slot.end_time = end_fmt
    if payload.order_index is not None:
        slot.order_index = payload.order_index
    if payload.subject is not None:
        slot.subject = payload.subject
    if payload.teacher_name is not None:
        slot.teacher_name = payload.teacher_name
    if payload.camera_id is not None:
        slot.camera_id = payload.camera_id
    if payload.is_active is not None:
        slot.is_active = payload.is_active

    db.commit()
    db.refresh(slot)
    return slot

@router.delete("/periods/{slot_id}", summary="Delete timetable period or break")
def delete_schedule_period(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Schedule slot not found")
    db.delete(slot)
    db.commit()
    return {"status": "DELETED", "slot_id": slot_id, "message": f"Slot '{slot.name}' deleted successfully."}


# 7. Holiday Calendar Management
@router.get("/holidays", response_model=List[HolidaySchema], summary="Get holiday calendar")
def get_holidays(db: Session = Depends(get_db)):
    return db.query(Holiday).order_by(Holiday.start_date.asc()).all()

@router.post("/holidays", response_model=HolidaySchema, summary="Add holiday or multi-day holiday range")
def create_holiday(payload: HolidayCreate, db: Session = Depends(get_db)):
    end_d = payload.end_date or payload.start_date
    if end_d < payload.start_date:
        raise HTTPException(status_code=400, detail="Holiday end date cannot be earlier than start date.")

    holiday = Holiday(
        name=payload.name,
        start_date=payload.start_date,
        end_date=end_d,
        holiday_type=payload.holiday_type or "NATIONAL",
        description=payload.description
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday

@router.put("/holidays/{holiday_id}", response_model=HolidaySchema, summary="Update holiday")
def update_holiday(holiday_id: int, payload: HolidayUpdate, db: Session = Depends(get_db)):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    start_d = payload.start_date or holiday.start_date
    end_d = payload.end_date or holiday.end_date
    if end_d < start_d:
        raise HTTPException(status_code=400, detail="Holiday end date cannot be earlier than start date.")

    if payload.name is not None:
        holiday.name = payload.name
    if payload.start_date is not None:
        holiday.start_date = start_d
    if payload.end_date is not None:
        holiday.end_date = end_d
    if payload.holiday_type is not None:
        holiday.holiday_type = payload.holiday_type
    if payload.description is not None:
        holiday.description = payload.description

    db.commit()
    db.refresh(holiday)
    return holiday

@router.delete("/holidays/{holiday_id}", summary="Delete holiday")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"status": "DELETED", "holiday_id": holiday_id, "message": f"Holiday '{holiday.name}' deleted successfully."}


# 8. Special Date Overrides (e.g., Saturday working days)
@router.get("/special-dates", response_model=List[SpecialDateOverrideSchema], summary="Get special working day overrides")
def get_special_dates(db: Session = Depends(get_db)):
    return db.query(SpecialDateOverride).order_by(SpecialDateOverride.date.asc()).all()

@router.post("/special-dates", response_model=SpecialDateOverrideSchema, summary="Add special working day or holiday date override")
def create_special_date(payload: SpecialDateOverrideCreate, db: Session = Depends(get_db)):
    existing = db.query(SpecialDateOverride).filter(SpecialDateOverride.date == payload.date).first()
    if existing:
        existing.is_working_day = payload.is_working_day
        existing.reason = payload.reason
        existing.apply_timetable = payload.apply_timetable or "DEFAULT"
        db.commit()
        db.refresh(existing)
        return existing

    override = SpecialDateOverride(
        date=payload.date,
        is_working_day=payload.is_working_day,
        reason=payload.reason,
        apply_timetable=payload.apply_timetable or "DEFAULT"
    )
    db.add(override)
    db.commit()
    db.refresh(override)
    return override

@router.delete("/special-dates/{override_id}", summary="Delete special date override")
def delete_special_date(override_id: int, db: Session = Depends(get_db)):
    override = db.query(SpecialDateOverride).filter(SpecialDateOverride.id == override_id).first()
    if not override:
        raise HTTPException(status_code=404, detail="Special date override not found")
    db.delete(override)
    db.commit()
    return {"status": "DELETED", "override_id": override_id}


# 9. Monthly Attendance Calculation & Calendar Analytics Endpoint
@router.get("/monthly-attendance", response_model=MonthlyAttendanceResponse, summary="Calculate monthly attendance with full calendar breakdown")
def get_monthly_attendance(
    student_id: str,
    year: int = Query(default=2026, ge=2020, le=2035),
    month: int = Query(default=8, ge=1, le=12),
    class_id: str = "CS101",
    db: Session = Depends(get_db)
):
    return ScheduleEngine.calculate_monthly_attendance(
        db=db,
        year=year,
        month=month,
        student_id=student_id,
        class_id=class_id
    )

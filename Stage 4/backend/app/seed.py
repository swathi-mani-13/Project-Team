from datetime import datetime, timedelta, timezone
from backend.app.database import SessionLocal, Base, engine
from backend.app.models.entities import (
    Student, ClassPeriod, CameraStatus, AttendanceSession, PresenceEvent, AttendanceAnomaly,
    AcademicSchedule, WeeklyWorkingDay, ScheduleSlot, Holiday, SpecialDateOverride
)

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    today_str = utc_now().strftime("%Y-%m-%d")

    # 1. Seed Academic Schedule
    if not db.query(AcademicSchedule).first():
        sched = AcademicSchedule(
            academic_year="2026-2027",
            semester="Odd Semester (Autumn 2026)",
            start_date="2026-08-01",
            end_date="2026-12-31",
            college_open_time="09:00:00",
            college_close_time="16:30:00",
            timezone="Asia/Kolkata",
            is_active=True
        )
        db.add(sched)

    # 2. Seed Weekly Working Days (Mon-Fri Working, Sat-Sun Holiday)
    if db.query(WeeklyWorkingDay).count() == 0:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekly_days = []
        for idx, name in enumerate(day_names):
            weekly_days.append(WeeklyWorkingDay(
                day_index=idx,
                day_name=name,
                is_working_day=(idx < 5)  # Mon-Fri
            ))
        db.add_all(weekly_days)

    # 3. Seed Default Timetable with Periods & Breaks
    if db.query(ScheduleSlot).count() == 0:
        default_slots = [
            ScheduleSlot(class_id="CS101", period_id="P1", name="Period 1", slot_type="CLASS", start_time="09:00:00", end_time="09:50:00", order_index=1, subject="Artificial Intelligence & ML", teacher_name="Dr. Alan Turing", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P2", name="Period 2", slot_type="CLASS", start_time="09:50:00", end_time="10:40:00", order_index=2, subject="Computer Vision & Biometrics", teacher_name="Dr. Fei-Fei Li", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="BREAK_1", name="Short Break", slot_type="BREAK", start_time="10:40:00", end_time="10:50:00", order_index=3, camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P3", name="Period 3", slot_type="CLASS", start_time="10:50:00", end_time="11:40:00", order_index=4, subject="Database Engineering", teacher_name="Prof. C.J. Date", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P4", name="Period 4", slot_type="CLASS", start_time="11:40:00", end_time="12:30:00", order_index=5, subject="Distributed Systems", teacher_name="Prof. Leslie Lamport", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="LUNCH", name="Lunch Break", slot_type="LUNCH", start_time="12:30:00", end_time="13:30:00", order_index=6, camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P5", name="Period 5", slot_type="CLASS", start_time="13:30:00", end_time="14:20:00", order_index=7, subject="Cloud Infrastructure", teacher_name="Dr. Werner Vogels", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P6", name="Period 6", slot_type="CLASS", start_time="14:20:00", end_time="15:10:00", order_index=8, subject="Cybersecurity & Cryptography", teacher_name="Dr. Whitfield Diffie", camera_id="CAM_01"),
            ScheduleSlot(class_id="CS101", period_id="P7", name="Period 7", slot_type="CLASS", start_time="15:10:00", end_time="16:00:00", order_index=9, subject="Capstone Project Lab", teacher_name="Dr. Alan Turing", camera_id="CAM_01"),
        ]
        db.add_all(default_slots)

    # 4. Seed Sample Holidays
    if db.query(Holiday).count() == 0:
        sample_holidays = [
            Holiday(name="Independence Day", start_date="2026-08-15", end_date="2026-08-15", holiday_type="NATIONAL", description="National Independence Day"),
            Holiday(name="Gandhi Jayanti", start_date="2026-10-02", end_date="2026-10-02", holiday_type="NATIONAL", description="National Holiday"),
            Holiday(name="Pongal Holidays", start_date="2027-01-14", end_date="2027-01-17", holiday_type="FESTIVAL", description="Harvest Festival 4-day holidays"),
        ]
        db.add_all(sample_holidays)

    # 5. Seed Sample Special Working Day (e.g. Saturday 2026-08-29 override)
    if db.query(SpecialDateOverride).count() == 0:
        override = SpecialDateOverride(
            date="2026-08-29",
            is_working_day=True,
            reason="Special Working Day (Compensatory for Festival)",
            apply_timetable="DEFAULT"
        )
        db.add(override)

    # 6. Seed Cameras
    if not db.query(CameraStatus).first():
        cameras = [
            CameraStatus(camera_id="CAM_01", name="Front Wide-Angle AI Cam", location="Room 302 - Front Center", status="ONLINE", fps=30.0),
            CameraStatus(camera_id="CAM_02", name="Rear Overview AI Cam", location="Room 302 - Rear Corner", status="ONLINE", fps=30.0),
        ]
        db.add_all(cameras)

    # 7. Seed Class Period
    if not db.query(ClassPeriod).filter(ClassPeriod.class_id == "CS101", ClassPeriod.period_id == "P1", ClassPeriod.date == today_str).first():
        period = ClassPeriod(
            class_id="CS101",
            period_id="P1",
            subject="CS401 - Artificial Intelligence & Computer Vision",
            teacher_name="Dr. Alan Turing",
            class_start_time="09:00:00",
            class_end_time="10:00:00",
            date=today_str,
            camera_id="CAM_01"
        )
        db.add(period)

    # 8. Seed Students
    students_data = [
        {"student_id": "23CS001", "name": "Harris Vance", "class_id": "CS101", "roll_number": "CS-01", "email": "harris.v@campus.edu"},
        {"student_id": "23CS002", "name": "Elena Rostova", "class_id": "CS101", "roll_number": "CS-02", "email": "elena.r@campus.edu"},
        {"student_id": "23CS003", "name": "Marcus Chen", "class_id": "CS101", "roll_number": "CS-03", "email": "marcus.c@campus.edu"},
        {"student_id": "23CS004", "name": "Amina Al-Mansoor", "class_id": "CS101", "roll_number": "CS-04", "email": "amina.m@campus.edu"},
        {"student_id": "23CS005", "name": "Devin Wright", "class_id": "CS101", "roll_number": "CS-05", "email": "devin.w@campus.edu"},
        {"student_id": "23CS006", "name": "Priya Sharma", "class_id": "CS101", "roll_number": "CS-06", "email": "priya.s@campus.edu"},
        {"student_id": "23CS007", "name": "Lucas Silva", "class_id": "CS101", "roll_number": "CS-07", "email": "lucas.s@campus.edu"},
        {"student_id": "23CS008", "name": "Sophia Müller", "class_id": "CS101", "roll_number": "CS-08", "email": "sophia.m@campus.edu"},
    ]

    for s_data in students_data:
        existing = db.query(Student).filter(Student.student_id == s_data["student_id"]).first()
        if not existing:
            db.add(Student(**s_data))

    db.commit()

    # 9. Seed sample historical past working days (e.g. 20 present days in August 2026 for Harris Vance)
    harris = db.query(Student).filter(Student.student_id == "23CS001").first()
    if harris and db.query(AttendanceSession).filter(AttendanceSession.student_id == "23CS001").count() == 0:
        past_sessions = []
        for i in range(1, 25):
            past_date = f"2026-08-{i:02d}"
            # Check if weekday (Mon-Fri) and not holiday (15th)
            dt_check = datetime(2026, 8, i)
            if dt_check.weekday() < 5 and i != 15:
                past_sessions.append(
                    AttendanceSession(
                        student_id="23CS001",
                        student_name="Harris Vance",
                        class_id="CS101",
                        period_id="P1",
                        date=past_date,
                        camera_id="CAM_01",
                        class_start_time="09:00:00",
                        class_end_time="09:50:00",
                        attendance_status="PRESENT",
                        entry_status="ON_TIME",
                        late_minutes=0,
                        presence_status="PRESENT",
                        presence_intervals=6,
                        missed_intervals=0,
                        confidence=0.95,
                        created_at=datetime(2026, 8, i, 9, 2, 0),
                        updated_at=datetime(2026, 8, i, 9, 50, 0)
                    )
                )
        db.add_all(past_sessions)
        db.commit()

    db.close()
    print("Database seeded successfully with Academic Schedule, Timetables, Holidays & Students.")

if __name__ == "__main__":
    seed_database()

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.entities import AttendanceSession, Student
from backend.app.config import settings

class MetricsCalculator:
    """
    Computes attendance percentage and classification according to business rules:
    Attendance % = (Present Days / Working Days) * 100
    >= 75% -> GOOD
    65-74% -> WARNING
    < 65%  -> CRITICAL
    """

    @staticmethod
    def classify_percentage(
        percentage: float,
        good_threshold: float = None,
        warning_threshold: float = None
    ) -> str:
        good_th = good_threshold if good_threshold is not None else settings.ATTENDANCE_GOOD_THRESHOLD
        warn_th = warning_threshold if warning_threshold is not None else settings.ATTENDANCE_WARNING_THRESHOLD

        if percentage >= good_th:
            return "GOOD"
        elif percentage >= warn_th:
            return "WARNING"
        else:
            return "CRITICAL"

    @staticmethod
    def calculate_student_percentage(
        db: Session,
        student_id: str,
        class_id: str = None,
        working_days: int = None
    ) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        student_name = student.name if student else student_id
        target_class_id = class_id or (student.class_id if student else "Unknown")

        query = db.query(func.count(func.distinct(AttendanceSession.date))).filter(
            AttendanceSession.student_id == student_id,
            AttendanceSession.attendance_status == "PRESENT"
        )
        if class_id:
            query = query.filter(AttendanceSession.class_id == class_id)

        present_days = query.scalar() or 0
        total_working_days = working_days if working_days is not None and working_days > 0 else settings.DEFAULT_WORKING_DAYS

        if total_working_days > 0:
            percentage = round((present_days / total_working_days) * 100, 2)
        else:
            percentage = 100.0

        classification = MetricsCalculator.classify_percentage(percentage)

        return {
            "student_id": student_id,
            "student_name": student_name,
            "class_id": target_class_id,
            "present_days": present_days,
            "working_days": total_working_days,
            "attendance_percentage": percentage,
            "status_classification": classification,
            "threshold_good": settings.ATTENDANCE_GOOD_THRESHOLD,
            "threshold_warning": settings.ATTENDANCE_WARNING_THRESHOLD
        }

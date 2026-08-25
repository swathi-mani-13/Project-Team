import random
from datetime import datetime, timezone
from typing import List, Optional
from backend.app.stages_pipeline.contracts import RecognizedStudentEvent

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

DEMO_STUDENTS = [
    {"student_id": "23CS001", "name": "Harris Vance", "class_id": "CS101"},
    {"student_id": "23CS002", "name": "Elena Rostova", "class_id": "CS101"},
    {"student_id": "23CS003", "name": "Marcus Chen", "class_id": "CS101"},
    {"student_id": "23CS004", "name": "Amina Al-Mansoor", "class_id": "CS101"},
    {"student_id": "23CS005", "name": "Devin Wright", "class_id": "CS101"},
    {"student_id": "23CS006", "name": "Priya Sharma", "class_id": "CS101"},
    {"student_id": "23CS007", "name": "Lucas Silva", "class_id": "CS101"},
    {"student_id": "23CS008", "name": "Sophia Müller", "class_id": "CS101"},
]

class Stage123PipelineSimulator:
    """
    Simulates upstream output from Stages 1, 2, and 3 for testing Stage 4.
    """

    @staticmethod
    def generate_single_event(
        student_id: Optional[str] = None,
        student_name: Optional[str] = None,
        class_id: str = "CS101",
        period_id: str = "P1",
        camera_id: str = "CAM_01",
        confidence: Optional[float] = None,
        timestamp: Optional[datetime] = None
    ) -> RecognizedStudentEvent:
        ts = timestamp or utc_now()
        if student_id:
            stud = next((s for s in DEMO_STUDENTS if s["student_id"] == student_id), None)
            name = student_name or (stud["name"] if stud else f"Student {student_id}")
            conf = confidence if confidence is not None else round(random.uniform(0.85, 0.99), 2)
            s_id = student_id
        elif student_id is None and confidence is not None and confidence < 0.8:
            # Low confidence test
            stud = random.choice(DEMO_STUDENTS)
            name = stud["name"]
            s_id = stud["student_id"]
            conf = confidence
        else:
            # Random student or unknown
            is_unknown = random.random() < 0.15
            if is_unknown:
                s_id = None
                name = None
                conf = round(random.uniform(0.40, 0.65), 2)
            else:
                stud = random.choice(DEMO_STUDENTS)
                s_id = stud["student_id"]
                name = stud["name"]
                conf = round(random.uniform(0.82, 0.98), 2)

        return RecognizedStudentEvent(
            student_id=s_id,
            student_name=name,
            confidence=conf,
            class_id=class_id,
            period_id=period_id,
            camera_id=camera_id,
            timestamp=ts,
            bbox=[random.randint(50, 400), random.randint(50, 300), 120, 120],
            face_id=f"FACE-{random.randint(1000, 9999)}"
        )

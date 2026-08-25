from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class CameraFrameEvent(BaseModel):
    """Stage 1: Camera Ingestion Output Contract"""
    camera_id: str
    frame_id: int
    timestamp: datetime
    fps: float
    resolution: str

class DetectedFace(BaseModel):
    """Stage 2: Face Detection & Tracking Output Contract"""
    face_id: str
    bbox: List[int]  # [x, y, width, height]
    detection_confidence: float
    camera_id: str
    timestamp: datetime

class RecognizedStudentEvent(BaseModel):
    """Stage 3: Face Recognition Output Contract (consumed by Stage 4)"""
    student_id: Optional[str]  # None if unknown face
    student_name: Optional[str]
    confidence: float
    class_id: str
    period_id: str
    camera_id: str
    timestamp: datetime
    bbox: Optional[List[int]] = None
    face_id: Optional[str] = None

class IStage1CameraIngestion(ABC):
    @abstractmethod
    def capture_frame(self, camera_id: str) -> CameraFrameEvent:
        pass

class IStage2FaceDetector(ABC):
    @abstractmethod
    def detect_faces(self, frame_event: CameraFrameEvent) -> List[DetectedFace]:
        pass

class IStage3FaceRecognizer(ABC):
    @abstractmethod
    def recognize_faces(self, detected_faces: List[DetectedFace], class_id: str, period_id: str) -> List[RecognizedStudentEvent]:
        pass

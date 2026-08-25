from backend.app.stage4.engine import Stage4AttendanceEngine
from backend.app.stage4.presence_tracker import PresenceTracker
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.stage4.camera_health import CameraHealthService
from backend.app.stage4.deduplicator import deduplicator, SlidingWindowDeduplicator
from backend.app.stage4.metrics import MetricsCalculator

__all__ = [
    "Stage4AttendanceEngine",
    "PresenceTracker",
    "AnomalyDetector",
    "CameraHealthService",
    "deduplicator",
    "SlidingWindowDeduplicator",
    "MetricsCalculator",
]

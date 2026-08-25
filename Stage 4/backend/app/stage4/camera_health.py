from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import CameraStatus
from backend.app.stage4.anomaly_detector import AnomalyDetector
from backend.app.config import settings

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class CameraHealthService:
    """
    Monitors camera status and heartbeats.
    Detects offline cameras without falsely marking students absent.
    """

    @staticmethod
    def record_heartbeat(
        db: Session,
        camera_id: str,
        name: Optional[str] = None,
        location: Optional[str] = None,
        status: str = "ONLINE",
        fps: float = 30.0,
        timestamp: Optional[datetime] = None
    ) -> CameraStatus:
        now = timestamp or utc_now()
        cam = db.query(CameraStatus).filter(CameraStatus.camera_id == camera_id).first()
        if not cam:
            cam = CameraStatus(
                camera_id=camera_id,
                name=name or f"Camera {camera_id}",
                location=location or "Main Classroom",
                status=status,
                last_heartbeat=now,
                last_frame_processed_at=now,
                total_detections_today=0,
                fps=fps
            )
            db.add(cam)
        else:
            cam.last_heartbeat = now
            cam.status = status
            if name:
                cam.name = name
            if location:
                cam.location = location
            if fps is not None:
                cam.fps = fps
        db.commit()
        db.refresh(cam)
        return cam

    @staticmethod
    def increment_detection_count(db: Session, camera_id: str, timestamp: Optional[datetime] = None):
        now = timestamp or utc_now()
        cam = db.query(CameraStatus).filter(CameraStatus.camera_id == camera_id).first()
        if cam:
            cam.total_detections_today += 1
            cam.last_frame_processed_at = now
            cam.last_heartbeat = now
            if cam.status == "OFFLINE":
                cam.status = "ONLINE"
            db.commit()

    @staticmethod
    def check_and_update_all_cameras(db: Session, now: Optional[datetime] = None) -> List[CameraStatus]:
        current_time = now or utc_now()
        timeout_seconds = settings.CAMERA_TIMEOUT_SECONDS
        cutoff = current_time - timedelta(seconds=timeout_seconds)

        cameras = db.query(CameraStatus).all()
        for cam in cameras:
            if cam.last_heartbeat < cutoff and cam.status != "OFFLINE":
                cam.status = "OFFLINE"
                AnomalyDetector.log_camera_offline(
                    db=db,
                    camera_id=cam.camera_id,
                    camera_name=cam.name,
                    timestamp=current_time
                )
        db.commit()
        return cameras

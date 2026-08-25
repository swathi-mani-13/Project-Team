import time
from typing import Dict, Tuple
from backend.app.config import settings

class SlidingWindowDeduplicator:
    """
    Sliding window cache for face-recognition events to prevent duplicate attendance triggers
    within the configured deduplication window (e.g., 30 seconds).
    """
    def __init__(self):
        # Key: (student_id, camera_id) -> timestamp (float)
        self._cache: Dict[Tuple[str, str], float] = {}

    def is_duplicate(self, student_id: str, camera_id: str, current_ts: float = None, window_seconds: int = None) -> bool:
        if not student_id:
            return False
        
        now = current_ts if current_ts is not None else time.time()
        window = window_seconds if window_seconds is not None else settings.RECOGNITION_DEDUPLICATION_SECONDS
        key = (student_id, camera_id)

        last_time = self._cache.get(key)
        if last_time is not None and (now - last_time) < window:
            return True
        
        # Update last seen timestamp
        self._cache[key] = now
        self._cleanup(now, window * 10)
        return False

    def reset_student(self, student_id: str, camera_id: str = None):
        if camera_id:
            self._cache.pop((student_id, camera_id), None)
        else:
            keys_to_del = [k for k in self._cache if k[0] == student_id]
            for k in keys_to_del:
                del self._cache[k]

    def clear(self):
        self._cache.clear()

    def _cleanup(self, now: float, max_age: float):
        if len(self._cache) > 2000:
            keys_to_del = [k for k, ts in self._cache.items() if (now - ts) > max_age]
            for k in keys_to_del:
                del self._cache[k]

deduplicator = SlidingWindowDeduplicator()

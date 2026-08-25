import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Stage4Settings(BaseSettings):
    # Core Application Settings
    APP_NAME: str = "AI Classroom Attendance & Presence Monitoring Engine"
    API_PREFIX: str = "/api/attendance"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")
    
    # 1. Late Entry Configuration
    LATE_THRESHOLD_MINUTES: int = Field(default=5, description="Minutes after class start considered late")
    
    # 2. Continuous Presence Configuration
    VERIFICATION_INTERVAL_MINUTES: int = Field(default=10, description="Periodic presence check interval")
    ABSENCE_CONFIRMATION_INTERVALS: int = Field(default=3, description="Consecutive missed intervals to trigger possible exit")
    
    # 3. Deduplication Configuration
    RECOGNITION_DEDUPLICATION_SECONDS: int = Field(default=30, description="Deduplication window in seconds")
    
    # 4. Face Recognition Confidence Handling
    CONFIDENCE_THRESHOLD: float = Field(default=0.80, description="Minimum confidence score for valid recognition")
    
    # 5. Camera & Data Health Monitoring
    CAMERA_TIMEOUT_SECONDS: int = Field(default=60, description="Heartbeat timeout before marking camera offline")
    
    # 6. Attendance Percentage Classification Thresholds
    ATTENDANCE_GOOD_THRESHOLD: float = Field(default=75.0, description="Percentage >= this is GOOD")
    ATTENDANCE_WARNING_THRESHOLD: float = Field(default=65.0, description="Percentage >= this is WARNING, below is CRITICAL")

    # 7. Total Working Days Default for Semester/Term
    DEFAULT_WORKING_DAYS: int = Field(default=80, description="Default working days if not specified")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Stage4Settings()

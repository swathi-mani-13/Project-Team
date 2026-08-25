import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.models.entities import *
from backend.app.seed import seed_database
from backend.app.routes.attendance import router as attendance_router, ws_manager
from backend.app.routes.schedule import router as schedule_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    description="Stage 4: Attendance + Presence Monitoring Engine for AI Classroom Monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Stage 4 Attendance & Schedule Routers
app.include_router(attendance_router)
app.include_router(schedule_router)

# WebSocket Real-Time Endpoint
@app.websocket("/ws/attendance")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and receive any client ping
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Stage 4 Attendance + Presence Monitoring Engine",
        "version": "1.0.0"
    }

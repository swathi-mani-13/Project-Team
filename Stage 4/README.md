# AI Classroom Monitoring System
## Stage 4: Attendance + Presence Monitoring Engine

This repository hosts the **Stage 4: Attendance + Presence Monitoring Engine** for the AI Classroom Monitoring platform.

For complete architectural details, API specifications, and configuration guides, refer to [stage4/README.md](file:///c:/attendence/stage4/README.md).

### Quick Start

1. **Install Backend Dependencies & Run Tests**:
   ```powershell
   python -m pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings pytest httpx python-dotenv websockets
   python -m pytest backend/tests/test_stage4_engine.py -v
   ```

2. **Run Backend Server**:
   ```powershell
   python -m uvicorn backend.app.main:app --port 8000 --reload
   ```

3. **Run Frontend Dashboard**:
   ```powershell
   cd frontend
   npm.cmd run dev
   ```

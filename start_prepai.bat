@echo off
echo ========================================================
echo               Launching PrepAI Platform
echo ========================================================
echo.
echo Starting Backend server on http://127.0.0.1:8001 ...
start "PrepAI Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

echo Starting Frontend server on http://localhost:5173 ...
start "PrepAI Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npx vite --host 127.0.0.1 --port 5173"

echo.
echo ========================================================
echo PrepAI is running!
echo - Frontend: http://localhost:5173/
echo - API Docs: http://127.0.0.1:8001/api/docs
echo ========================================================
pause

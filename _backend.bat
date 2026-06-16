@echo off
title JSSATEB Backend (port 8000)
color 0B
echo ============================================================
echo    BACKEND  -  FastAPI  (http://localhost:8000)
echo ============================================================
echo.

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM ---------- Virtual environment ----------
if not exist "%ROOT%venv\Scripts\python.exe" (
    echo [setup] Creating Python virtual environment...
    python -m venv "%ROOT%venv"
)
set "PY=%ROOT%venv\Scripts\python.exe"

REM ---------- Dependencies (install once; marker file avoids re-installing) ----------
if not exist "%ROOT%venv\.deps_installed" (
    echo [setup] Installing Python packages ^(first run may take a minute^)...
    "%PY%" -m pip install --upgrade pip
    "%PY%" -m pip install -r "%ROOT%backend\requirements.txt"
    if errorlevel 1 (
        echo.
        echo [ERROR] Package installation failed. See messages above.
        pause
        exit /b 1
    )
    echo done > "%ROOT%venv\.deps_installed"
)

REM ---------- Seed database (only if missing) ----------
if not exist "%ROOT%fintech.db" (
    echo [setup] Seeding demo database ^(~20k transactions^)...
    "%PY%" "%ROOT%populate_data.py"
)

REM ---------- Run the API ----------
echo.
echo [run] Starting API server...  (press Ctrl+C to stop)
echo.
cd /d "%ROOT%backend"
set PYTHONIOENCODING=utf-8
"%PY%" -m uvicorn main:app --host 127.0.0.1 --port 8000

echo.
echo [stopped] Backend has exited.
pause

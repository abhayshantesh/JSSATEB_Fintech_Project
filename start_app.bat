@echo off
setlocal enabledelayedexpansion
title JSSATEB Financial Analytics - Launcher
color 0F

echo ============================================================
echo    AI-Driven Institutional Financial Analytics System
echo                  One-Click Launcher
echo ============================================================
echo.

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM ---------- 1. Check prerequisites ----------
echo [1/5] Checking prerequisites...
where python >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Python was not found on PATH.
    echo          Install Python 3.9+ from https://python.org and re-run.
    echo.
    pause
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Node.js was not found on PATH.
    echo          Install Node.js 18+ from https://nodejs.org and re-run.
    echo.
    pause
    exit /b 1
)
echo       Python and Node.js found.
echo.

REM ---------- 2. Backend dependencies (in a virtual environment) ----------
echo [2/5] Setting up backend (Python virtual environment)...
if not exist "%ROOT%venv\Scripts\python.exe" (
    echo       Creating virtual environment...
    python -m venv "%ROOT%venv"
)
set "VENV_PY=%ROOT%venv\Scripts\python.exe"
echo       Installing Python packages (first run may take a minute)...
"%VENV_PY%" -m pip install --upgrade pip --quiet
"%VENV_PY%" -m pip install -r "%ROOT%backend\requirements.txt" --quiet
echo       Backend ready.
echo.

REM ---------- 3. Seed the database (only if missing) ----------
echo [3/5] Preparing database...
if exist "%ROOT%fintech.db" (
    echo       Database already exists. Delete fintech.db to regenerate.
) else (
    echo       Seeding demo database (~20k transactions)...
    "%VENV_PY%" "%ROOT%populate_data.py"
)
echo.

REM ---------- 4. Frontend dependencies ----------
echo [4/5] Setting up frontend (Node packages)...
if exist "%ROOT%frontend\node_modules" (
    echo       Frontend packages already installed.
) else (
    echo       Installing npm packages (first run may take a few minutes)...
    pushd "%ROOT%frontend"
    call npm install
    popd
)
echo.

REM ---------- 5. Launch both servers ----------
echo [5/5] Starting servers...
start "JSSATEB Backend  (port 8000)" cmd /k ^
    "cd /d "%ROOT%backend" ^&^& "%VENV_PY%" -m uvicorn main:app --host 127.0.0.1 --port 8000"

REM give the backend a moment to boot before the frontend
timeout /t 4 /nobreak >nul

start "JSSATEB Frontend (port 5173)" cmd /k ^
    "cd /d "%ROOT%frontend" ^&^& npm run dev"

echo.
echo ============================================================
echo    Servers are starting in two new windows.
echo.
echo      Frontend (open this):  http://localhost:5173
echo      Backend API:           http://localhost:8000
echo      API docs:              http://localhost:8000/docs
echo.
echo    Optional: to enable Live AI, put your key in a file
echo    named ".env" in this folder:
echo        OPENROUTER_API_KEY=your_key_here
echo    (Without a key the AI uses a built-in fallback.)
echo.
echo    To stop: close the two server windows.
echo ============================================================
echo.

REM open the app in the default browser
timeout /t 6 /nobreak >nul
start "" http://localhost:5173

echo This launcher window can now be closed.
pause
endlocal

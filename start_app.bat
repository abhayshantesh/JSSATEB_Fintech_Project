@echo off
title JSSATEB Financial Analytics - Launcher
color 0F

echo ============================================================
echo    AI-Driven Institutional Financial Analytics System
echo                  One-Click Launcher
echo ============================================================
echo.

set "ROOT=%~dp0"

REM ---------- Check prerequisites ----------
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python was not found on PATH.
    echo          Install Python 3.9+ from https://python.org and re-run.
    pause
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js was not found on PATH.
    echo          Install Node.js 18+ from https://nodejs.org and re-run.
    pause
    exit /b 1
)
echo  Python and Node.js found.
echo.
echo  Opening two terminals (Backend + Frontend)...
echo  Each window installs what it needs on first run, then starts.
echo.

REM ---------- Terminal 1: BACKEND ----------
REM /D sets the working directory cleanly (no nested cd/quotes).
start "JSSATEB Backend (port 8000)" /D "%ROOT%" cmd /k _backend.bat

REM ---------- Terminal 2: FRONTEND ----------
start "JSSATEB Frontend (port 5173)" /D "%ROOT%frontend" cmd /k _frontend.bat

echo  Waiting for servers to start, then opening the browser...
timeout /t 12 /nobreak >nul
start "" http://localhost:5173

echo.
echo ============================================================
echo    Done. Two server windows are running:
echo      Frontend (open this):  http://localhost:5173
echo      Backend API / docs:    http://localhost:8000/docs
echo.
echo    Optional - enable Live AI by creating a file named .env
echo    in this folder containing:
echo        OPENROUTER_API_KEY=your_key_here
echo.
echo    To stop: close the two server windows.
echo ============================================================
echo.
echo  This launcher window can be closed.
timeout /t 5 /nobreak >nul

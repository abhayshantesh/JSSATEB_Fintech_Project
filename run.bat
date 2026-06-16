@echo off
setlocal
title JSSATEB Financial Analytics - Run
color 0F

REM ============================================================
REM   Quick launcher: starts BACKEND + FRONTEND in two windows.
REM   Use this once dependencies are installed.
REM   First time? Run start_app.bat instead (it installs deps
REM   and seeds the database).
REM ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM -- Pick the Python to use: prefer the project venv, else system python --
if exist "%ROOT%venv\Scripts\python.exe" (
    set "PY=%ROOT%venv\Scripts\python.exe"
) else (
    set "PY=python"
)

REM -- Safety checks --
if not exist "%ROOT%fintech.db" (
    echo [!] Database fintech.db not found.
    echo     Run start_app.bat first to install dependencies and seed data.
    echo.
    pause
    exit /b 1
)
if not exist "%ROOT%frontend\node_modules" (
    echo [!] Frontend dependencies not found.
    echo     Run start_app.bat first to install them.
    echo.
    pause
    exit /b 1
)

echo Starting backend (http://localhost:8000) ...
start "JSSATEB Backend  (port 8000)" cmd /k ^
    "cd /d "%ROOT%backend" ^&^& "%PY%" -m uvicorn main:app --host 127.0.0.1 --port 8000"

REM give the backend a moment to boot
timeout /t 4 /nobreak >nul

echo Starting frontend (http://localhost:5173) ...
start "JSSATEB Frontend (port 5173)" cmd /k ^
    "cd /d "%ROOT%frontend" ^&^& npm run dev"

echo.
echo ============================================================
echo    Both servers are starting in separate windows.
echo      Open the app:  http://localhost:5173
echo      API docs:      http://localhost:8000/docs
echo    To stop: close the two server windows.
echo ============================================================
echo.

REM open the app once the frontend has had time to start
timeout /t 6 /nobreak >nul
start "" http://localhost:5173

endlocal

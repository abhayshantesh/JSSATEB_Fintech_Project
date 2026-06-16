@echo off
title JSSATEB Financial Analytics - Run
color 0F

REM ============================================================
REM   Quick launcher: opens BACKEND + FRONTEND in two terminals.
REM   Use this once dependencies are installed.
REM   First time? Run start_app.bat instead (it installs deps
REM   and seeds the database).
REM ============================================================

set "ROOT=%~dp0"

if not exist "%ROOT%fintech.db" (
    echo [!] fintech.db not found - run start_app.bat first.
    pause
    exit /b 1
)
if not exist "%ROOT%frontend\node_modules" (
    echo [!] Frontend not installed - run start_app.bat first.
    pause
    exit /b 1
)

echo Opening backend and frontend terminals...
start "JSSATEB Backend (port 8000)"  /D "%ROOT%"          cmd /k _backend.bat
start "JSSATEB Frontend (port 5173)" /D "%ROOT%frontend"  cmd /k _frontend.bat

echo Waiting for servers, then opening the browser...
timeout /t 10 /nobreak >nul
start "" http://localhost:5173

echo.
echo  Backend:  http://localhost:8000/docs
echo  Frontend: http://localhost:5173
echo  To stop: close the two server windows.
timeout /t 4 /nobreak >nul

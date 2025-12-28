@echo off
title Fintech Application Launcher
echo ============================================
echo    JSSATEB Fintech Application Launcher
echo ============================================
echo.

:: Set the project root directory
set PROJECT_ROOT=%~dp0

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd /d "%PROJECT_ROOT%backend"
pip install fastapi uvicorn sqlalchemy pandas numpy scikit-learn statsmodels scipy --quiet

echo [2/4] Installing frontend dependencies...
cd /d "%PROJECT_ROOT%frontend"
if not exist "node_modules" (
    call npm install
) else (
    echo      Frontend dependencies already installed.
)

echo [3/4] Starting Backend Server...
cd /d "%PROJECT_ROOT%backend"
start "Fintech Backend" cmd /k "python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [4/4] Starting Frontend Server...
cd /d "%PROJECT_ROOT%frontend"
timeout /t 3 /nobreak >nul
start "Fintech Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo    Servers are starting...
echo ============================================
echo.
echo    Backend API:  http://localhost:8000
echo    Frontend UI:  http://localhost:5173
echo    API Docs:     http://localhost:8000/docs
echo.
echo    Close this window when you're done.
echo    The server windows will remain open.
echo ============================================

:: Wait a moment then open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause

@echo off
title JSSATEB Frontend (port 5173)
color 0E
echo ============================================================
echo    FRONTEND  -  React + Vite  (http://localhost:5173)
echo ============================================================
echo.

REM This script is launched with its working directory set to frontend/.

REM ---------- Dependencies (install once) ----------
if not exist "node_modules" (
    echo [setup] Installing npm packages ^(first run may take a few minutes^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. See messages above.
        pause
        exit /b 1
    )
)

REM ---------- Run the dev server ----------
echo.
echo [run] Starting dev server...  (press Ctrl+C to stop)
echo.
call npm run dev

echo.
echo [stopped] Frontend has exited.
pause

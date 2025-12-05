@echo off
REM ASTRA GRID - Local Development Start Script (Windows)

echo ========================================
echo    ASTRA GRID - Development Start
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://python.org
    exit /b 1
)

echo [1/4] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)

echo.
echo [2/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
cd ..

echo.
echo [3/4] Starting backend services...
start "ASTRA Backend - Auth" cmd /k "cd backend && python auth_app.py"
timeout /t 2 /nobreak >nul
start "ASTRA Backend - Simulation" cmd /k "cd backend && python simulation_api.py"

echo.
echo [4/4] Starting frontend development server...
timeout /t 3 /nobreak >nul
start "ASTRA Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo    All services started successfully!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend Auth API: http://localhost:5001
echo Simulation API: http://localhost:5002
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq ASTRA*" /F

@echo off
REM ASTRA GRID - Unified API Start Script (Windows)

echo ========================================
echo    ASTRA GRID - Unified Backend API
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://python.org
    exit /b 1
)

echo [1/2] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)

echo.
echo [2/2] Starting unified backend API on port 5000...
python unified_api.py

pause

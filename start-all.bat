@echo off
REM ============================================================================
REM ASTRA GRID - Complete Startup Script for All Services
REM ============================================================================
REM This script starts all 6 backend services + 1 frontend service
REM Total: 7 services running on separate ports
REM ============================================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

cls
echo.
echo ============================================================================
echo          ASTRA GRID - COMPLETE APPLICATION STARTUP
echo ============================================================================
echo.
echo Starting all services...
echo.
echo Services to start:
echo   1. Frontend (React/Vite) ...................... Port 3000
echo   2. Unified API ............................. Port 5000
echo   3. Auth Service ............................ Port 5001
echo   4. Simulation (ML Engine) .................. Port 5002
echo   5. Chatbot API ............................. Port 5003
echo   6. Document Extractor (AWS Textract) ....... Port 5004
echo   7. MongoDB (Database) ...................... Port 27017
echo.
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [*] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Node.js not found! Please install Node.js first.%RESET%
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check if Python is installed
echo [*] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Python not found! Please install Python first.%RESET%
    pause
    exit /b 1
)
echo [OK] Python found

REM Check if MongoDB is installed (optional)
echo [*] Checking MongoDB installation...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARN] MongoDB not found - database services may fail%RESET%
) else (
    echo [OK] MongoDB found
)

echo.
echo ============================================================================
echo Starting services in separate windows...
echo ============================================================================
echo.

REM Kill any existing processes on our ports to avoid conflicts
echo [*] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM ============================================================================
REM START FRONTEND (React/Vite on Port 3000)
REM ============================================================================
echo [1] Starting Frontend (React/Vite) on port 3000...
start "ASTRA GRID - Frontend" cmd /k ^
    cd /d "%SCRIPT_DIR%" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - FRONTEND ^& ^
    echo Port: 3000 ^& ^
    echo ========================================== ^& ^
    npm run dev

timeout /t 3 /nobreak >nul

REM ============================================================================
REM START UNIFIED API (Port 5000)
REM ============================================================================
echo [2] Starting Unified API on port 5000...
start "ASTRA GRID - Unified API (5000)" cmd /k ^
    cd /d "%SCRIPT_DIR%\backend" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - UNIFIED API ^& ^
    echo Port: 5000 ^& ^
    echo ========================================== ^& ^
    python unified_api.py

timeout /t 2 /nobreak >nul

REM ============================================================================
REM START AUTH SERVICE (Port 5001)
REM ============================================================================
echo [3] Starting Auth Service on port 5001...
start "ASTRA GRID - Auth Service (5001)" cmd /k ^
    cd /d "%SCRIPT_DIR%\backend" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - AUTH SERVICE ^& ^
    echo Port: 5001 ^& ^
    echo ========================================== ^& ^
    python auth_app.py

timeout /t 2 /nobreak >nul

REM ============================================================================
REM START SIMULATION API (Port 5002)
REM ============================================================================
echo [4] Starting Simulation API on port 5002...
start "ASTRA GRID - Simulation API (5002)" cmd /k ^
    cd /d "%SCRIPT_DIR%\backend" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - SIMULATION API (ML Engine) ^& ^
    echo Port: 5002 ^& ^
    echo ========================================== ^& ^
    python simulation_api.py

timeout /t 2 /nobreak >nul

REM ============================================================================
REM START CHATBOT API (Port 5003)
REM ============================================================================
echo [5] Starting Chatbot API on port 5003...
start "ASTRA GRID - Chatbot API (5003)" cmd /k ^
    cd /d "%SCRIPT_DIR%\backend" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - CHATBOT API ^& ^
    echo Port: 5003 ^& ^
    echo ========================================== ^& ^
    python chatbot_api.py

timeout /t 2 /nobreak >nul

REM ============================================================================
REM START DOCUMENT EXTRACTOR API (Port 5004)
REM ============================================================================
echo [6] Starting Document Extractor on port 5004...
start "ASTRA GRID - Document Extractor (5004)" cmd /k ^
    cd /d "%SCRIPT_DIR%\backend" ^& ^
    echo ========================================== ^& ^
    echo ASTRA GRID - DOCUMENT EXTRACTOR ^& ^
    echo Port: 5004 ^& ^
    echo ========================================== ^& ^
    python document_extractor_api.py

timeout /t 2 /nobreak >nul

REM ============================================================================
REM DISPLAY SUMMARY
REM ============================================================================
cls
echo.
echo ============================================================================
echo                   ASTRA GRID - ALL SERVICES STARTED!
echo ============================================================================
echo.
echo Services Running:
echo.
echo   [✓] Frontend (React/Vite)
echo       URL: http://localhost:3000
echo       Status: Check the Frontend window
echo.
echo   [✓] Unified API
echo       URL: http://localhost:5000
echo       Health: http://localhost:5000/api/health
echo.
echo   [✓] Auth Service
echo       URL: http://localhost:5001
echo       Endpoints: /login, /register, /verify
echo.
echo   [✓] Simulation API (ML Engine)
echo       URL: http://localhost:5002
echo       Endpoints: /predict, /train, /models
echo.
echo   [✓] Chatbot API
echo       URL: http://localhost:5003
echo       Endpoints: /chat, /history
echo.
echo   [✓] Document Extractor
echo       URL: http://localhost:5004
echo       Endpoints: /extract, /upload
echo       Features: AWS Textract, PDF Processing
echo.
echo   [✓] MongoDB (Database)
echo       Port: 27017
echo       Status: Check MongoDB window or services
echo.
echo ============================================================================
echo.
echo Quick Test Commands (open another terminal):
echo.
echo   # Test Frontend
echo   start http://localhost:3000
echo.
echo   # Test Unified API
echo   curl http://localhost:5000/api/health
echo.
echo   # Test Auth Service
echo   curl http://localhost:5001/health
echo.
echo   # Test Simulation
echo   curl http://localhost:5002/health
echo.
echo   # Test Chatbot
echo   curl http://localhost:5003/health
echo.
echo   # Test Document Extractor
echo   curl http://localhost:5004/health
echo.
echo ============================================================================
echo.
echo Windows Open:
echo   - Frontend: Check the "ASTRA GRID - Frontend" window
echo   - Unified API: Check the "ASTRA GRID - Unified API (5000)" window
echo   - Auth: Check the "ASTRA GRID - Auth Service (5001)" window
echo   - Simulation: Check the "ASTRA GRID - Simulation API (5002)" window
echo   - Chatbot: Check the "ASTRA GRID - Chatbot API (5003)" window
echo   - Extractor: Check the "ASTRA GRID - Document Extractor (5004)" window
echo.
echo ============================================================================
echo.
echo IMPORTANT NOTES:
echo.
echo 1. All windows will stay open - monitor them for errors
echo 2. If any service fails, check the error in that window
echo 3. To stop all services: Close the terminal windows or run stop-all.bat
echo 4. MongoDB must be running (start MongoDB service separately if needed)
echo 5. Press Ctrl+C in any window to stop that service
echo.
echo ============================================================================
echo.
echo Logging into background (optional):
echo   All logs are displayed in their respective terminal windows
echo   Check each window for real-time logs and errors
echo.
echo ============================================================================
pause

@echo off
REM ============================================================
REM ASTRA GRID - LOCAL NETWORK STARTUP SCRIPT
REM ============================================================
REM This script starts all services accessible on local network
REM Access from any device: http://YOUR_LOCAL_IP:3000
REM ============================================================

setlocal enabledelayedexpansion

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    goto :found_ip
)

:found_ip
set "IP=!IP: =!"
if "!IP!"=="" (
    echo ERROR: Could not find local IP address
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ASTRA GRID - STARTING SERVICES FOR LOCAL NETWORK ACCESS
echo ============================================================
echo.
echo Your Local IP: !IP!
echo Access the app at: http://!IP!:3000
echo.
echo Services starting:
echo   - Frontend (React/Vite)       : Port 3000 [http://!IP!:3000]
echo   - Prediction Model API        : Port 5000 [http://!IP!:5000/health]
echo   - Auth Service API            : Port 5001
echo   - Simulation API              : Port 5002
echo   - Chatbot API                 : Port 5003
echo   - Document Extractor API      : Port 5004
echo.
echo MongoDB should be running on: localhost:27017
echo.
echo Press ENTER to continue or CTRL+C to cancel...
pause

REM Kill any existing processes on these ports
echo Cleaning up existing processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak

REM START FRONTEND (React/Vite dev server)
echo.
echo [1/6] Starting Frontend (Port 3000)...
start "ASTRA GRID - Frontend" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID" && npm run dev"
timeout /t 3 /nobreak

REM START PREDICTION MODEL API (Port 5000) - THE ACTUAL ML MODEL
echo [2/6] Starting Prediction Model API (Port 5000)...
start "ASTRA GRID - Prediction Model" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID\backend\Model" && python app.py"
timeout /t 2 /nobreak

REM START AUTH SERVICE (Port 5001)
echo [3/6] Starting Auth Service (Port 5001)...
start "ASTRA GRID - Auth Service" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID\backend" && python auth_app.py"
timeout /t 2 /nobreak

REM START SIMULATION API (Port 5002)
echo [4/6] Starting Simulation API (Port 5002)...
start "ASTRA GRID - Simulation API" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID\backend" && python simulation_api.py"
timeout /t 2 /nobreak

REM START CHATBOT API (Port 5003)
echo [5/6] Starting Chatbot API (Port 5003)...
start "ASTRA GRID - Chatbot API" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID\backend" && python chatbot_api.py"
timeout /t 2 /nobreak

REM START DOCUMENT EXTRACTOR (Port 5004)
echo [6/6] Starting Document Extractor (Port 5004)...
start "ASTRA GRID - Document Extractor" cmd /k "cd /d "c:\Users\viper\OneDrive\Desktop\ASTRA_GRID\backend" && python document_extractor_api.py"
timeout /t 2 /nobreak

echo.
echo ============================================================
echo ALL SERVICES STARTED!
echo ============================================================
echo.
echo Access the application:
echo   LOCAL:      http://localhost:3000
echo   NETWORK:    http://!IP!:3000
echo.
echo You can now access from:
echo   - This computer
echo   - Other computers on the same network
echo   - Mobile devices on WiFi
echo.
echo Logs are in separate terminal windows above
echo Close this window when done, or press any key
pause

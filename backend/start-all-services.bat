@echo off
echo ================================
echo ASTRA GRID - Starting All Backend Services
echo ================================
echo.

echo Starting Authentication Service (Port 5001)...
start "Auth API - Port 5001" cmd /k "cd /d %~dp0 && python auth_app.py"
timeout /t 2 /nobreak >nul

echo Starting ML Prediction Service (Port 5000)...
start "Prediction API - Port 5000" cmd /k "cd /d %~dp0\Model && python app.py"
timeout /t 2 /nobreak >nul

echo Starting Simulation Service (Port 5002)...
start "Simulation API - Port 5002" cmd /k "cd /d %~dp0 && python simulation_api.py"
timeout /t 2 /nobreak >nul

echo Starting Chatbot Service (Port 5003)...
start "Chatbot API - Port 5003" cmd /k "cd /d %~dp0 && python chatbot_api.py"
timeout /t 2 /nobreak >nul

echo.
echo ================================
echo All services started!
echo ================================
echo.
echo Services running on:
echo   - Auth:       http://localhost:5001
echo   - Prediction: http://localhost:5000
echo   - Simulation: http://localhost:5002
echo   - Chatbot:    http://localhost:5003
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping all services...
taskkill /FI "WINDOWTITLE eq Auth API - Port 5001*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Prediction API - Port 5000*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Simulation API - Port 5002*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Chatbot API - Port 5003*" /F >nul 2>&1

echo All services stopped.

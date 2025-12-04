@echo off
title Local RAG Chatbot - Starting All Services
cd /d "%~dp0"

echo.
echo ============================================
echo    Local RAG Chatbot - Production Mode
echo ============================================
echo.
echo Starting all services...
echo.

echo [1/2] Starting Backend Server (Python FastAPI)...
start "Backend Server" cmd /c start-backend.bat

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (React)...
start "Frontend Server" cmd /c start.bat

echo.
echo ============================================
echo    Services Started Successfully!
echo ============================================
echo.
echo Backend:  http://localhost:8501
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:3000

echo.
echo Application is running!
echo Close both server windows to stop the application.
echo.
pause

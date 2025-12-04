@echo off
title Local RAG Chatbot - Backend Server
cd /d "%~dp0"

echo.
echo ========================================
echo  Local RAG Chatbot - Backend Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Checking Python installation...
python --version

echo.
echo [2/3] Installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo [3/3] Starting FastAPI backend server...
echo Server will be available at: http://localhost:8501
echo.

python backend.py

pause

@echo off
title PowerGrid AI Chatbot
cd /d "%~dp0"

echo.
echo ============================================
echo    PowerGrid AI Chatbot - Widget Mode
echo ============================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /c start-backend.bat

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Widget...
start "Frontend Widget" cmd /c start.bat

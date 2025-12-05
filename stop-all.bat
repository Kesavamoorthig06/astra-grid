@echo off
REM ============================================================================
REM ASTRA GRID - Stop All Services Script
REM ============================================================================
REM This script stops all running services started by start-all.bat
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo          ASTRA GRID - STOPPING ALL SERVICES
echo ============================================================================
echo.

REM Kill Node.js processes (Frontend)
echo [*] Stopping Frontend (Node.js)...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo [WARN] Node.js processes not found
) else (
    echo [OK] Frontend stopped
)

REM Kill Python processes (All backend services)
echo [*] Stopping Backend Services (Python)...
taskkill /F /IM python.exe >nul 2>&1
if errorlevel 1 (
    echo [WARN] Python processes not found
) else (
    echo [OK] All backend services stopped
)

REM Kill MongoDB (if running)
echo [*] Stopping MongoDB...
taskkill /F /IM mongod.exe >nul 2>&1
if errorlevel 1 (
    echo [WARN] MongoDB not running
) else (
    echo [OK] MongoDB stopped
)

echo.
echo ============================================================================
echo                   ALL SERVICES STOPPED!
echo ============================================================================
echo.
echo Summary:
echo   - Frontend (React/Vite) ............ Stopped
echo   - Unified API (5000) .............. Stopped
echo   - Auth Service (5001) ............. Stopped
echo   - Simulation API (5002) ........... Stopped
echo   - Chatbot API (5003) .............. Stopped
echo   - Document Extractor (5004) ....... Stopped
echo   - MongoDB .......................... Stopped
echo.
echo ============================================================================
echo.
pause

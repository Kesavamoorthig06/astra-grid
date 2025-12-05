@echo off
REM ============================================================================
REM ASTRA GRID - Service Status Check
REM ============================================================================
REM This script checks the status of all services
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo          ASTRA GRID - SERVICE STATUS CHECK
echo ============================================================================
echo.

set /a count=0

REM Check Frontend (Port 3000)
echo [*] Checking Frontend (Port 3000)...
netstat -ano | findstr ":3000 " >nul
if errorlevel 1 (
    echo [X] Frontend ........................... NOT RUNNING
) else (
    echo [OK] Frontend .......................... RUNNING on Port 3000
    set /a count=count+1
)

REM Check Unified API (Port 5000)
echo [*] Checking Unified API (Port 5000)...
netstat -ano | findstr ":5000 " >nul
if errorlevel 1 (
    echo [X] Unified API ........................ NOT RUNNING
) else (
    echo [OK] Unified API ....................... RUNNING on Port 5000
    set /a count=count+1
)

REM Check Auth Service (Port 5001)
echo [*] Checking Auth Service (Port 5001)...
netstat -ano | findstr ":5001 " >nul
if errorlevel 1 (
    echo [X] Auth Service ....................... NOT RUNNING
) else (
    echo [OK] Auth Service ...................... RUNNING on Port 5001
    set /a count=count+1
)

REM Check Simulation API (Port 5002)
echo [*] Checking Simulation API (Port 5002)...
netstat -ano | findstr ":5002 " >nul
if errorlevel 1 (
    echo [X] Simulation API ..................... NOT RUNNING
) else (
    echo [OK] Simulation API ................... RUNNING on Port 5002
    set /a count=count+1
)

REM Check Chatbot API (Port 5003)
echo [*] Checking Chatbot API (Port 5003)...
netstat -ano | findstr ":5003 " >nul
if errorlevel 1 (
    echo [X] Chatbot API ........................ NOT RUNNING
) else (
    echo [OK] Chatbot API ....................... RUNNING on Port 5003
    set /a count=count+1
)

REM Check Document Extractor (Port 5004)
echo [*] Checking Document Extractor (Port 5004)...
netstat -ano | findstr ":5004 " >nul
if errorlevel 1 (
    echo [X] Document Extractor ................ NOT RUNNING
) else (
    echo [OK] Document Extractor ............... RUNNING on Port 5004
    set /a count=count+1
)

REM Check MongoDB (Port 27017)
echo [*] Checking MongoDB (Port 27017)...
netstat -ano | findstr ":27017 " >nul
if errorlevel 1 (
    echo [X] MongoDB ............................ NOT RUNNING
) else (
    echo [OK] MongoDB ........................... RUNNING on Port 27017
    set /a count=count+1
)

echo.
echo ============================================================================
echo                        STATUS SUMMARY
echo ============================================================================
echo.
echo Services Running: !count!/7
echo.

if !count! equ 7 (
    echo [SUCCESS] All services are running!
    echo.
    echo Access your application at:
    echo   Frontend: http://localhost:3000
) else (
    echo [WARNING] Some services are not running.
    echo.
    echo Make sure to:
    echo   1. Run start-all.bat to start all services
    echo   2. Check each service window for errors
    echo   3. Verify MongoDB is running
)

echo.
echo ============================================================================
echo.
echo Running Processes:
echo.
tasklist | findstr /I "node.exe python.exe mongod.exe"

echo.
echo ============================================================================
echo.
pause

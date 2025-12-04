@echo off
echo Starting ASTRA GRID Backend Server...
cd /d "%~dp0backend"
python auth_app.py
pause

@echo off
echo Starting Authentication API on port 5001...
cd /d "%~dp0"
python auth_app.py
pause

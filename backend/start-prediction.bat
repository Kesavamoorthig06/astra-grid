@echo off
echo Starting Prediction API on port 5000...
cd /d "%~dp0\Model"
python app.py
pause

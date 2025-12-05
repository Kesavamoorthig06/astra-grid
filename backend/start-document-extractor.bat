@echo off
echo Starting Document Extractor API on port 5004...
cd /d "%~dp0"
python document_extractor_api.py
pause

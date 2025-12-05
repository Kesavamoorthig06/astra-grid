#!/bin/bash
# ASTRA GRID - Unified API Start Script (Linux/Mac)

echo "========================================"
echo "  ASTRA GRID - Unified Backend API"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed!"
    exit 1
fi

echo "[1/2] Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "[2/2] Starting unified backend API on port 5000..."
python3 unified_api.py

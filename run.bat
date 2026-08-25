@echo off
chcp 65001 > nul
title FinTrack AI - He Thong Quan Ly Chi Tieu Ca Nhan

echo ======================================================================
echo           KHOI CHAY HE THONG FINTRACK AI
echo ======================================================================
echo.

cd /d "%~dp0"

if exist "venv\Scripts\python.exe" (
    echo [OK] Tim thay moi truong ao venv. Dang khoi chay...
    "venv\Scripts\python.exe" run.py
) else if exist "py.exe" (
    echo [INFO] Dang chay qua py launcher...
    py run.py
) else (
    echo [INFO] Dang chay qua python...
    python run.py
)

pause

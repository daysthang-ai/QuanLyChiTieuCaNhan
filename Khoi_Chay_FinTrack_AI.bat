@echo off
chcp 65001 > nul
title FinTrack AI - He Thong Quan Ly Chi Tieu Thong Minh
cd /d "%~dp0"

echo ======================================================================
echo           🚀 KHỞI CHẠY HỆ THỐNG FINTRACK AI THÔNG MINH
echo ======================================================================
echo.

if exist "venv\Scripts\python.exe" (
    echo [OK] Tim thay moi truong ao venv. Dang khoi chay may chu...
    "venv\Scripts\python.exe" run.py
) else (
    echo [INFO] Dang khoi chay qua python he thong...
    python run.py
)

pause

@echo off
chcp 65001 > nul
title FinTrack AI Launcher
cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" run.py
) else if exist "py.exe" (
    py run.py
) else (
    python run.py
)
pause

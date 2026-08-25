# FinTrack AI - PowerShell Starter Script
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "           KHỞI CHẠY HỆ THỐNG FINTRACK AI" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (Test-Path "$scriptDir\venv\Scripts\python.exe") {
    Write-Host "[OK] Đang chạy với môi trường ảo venv..." -ForegroundColor Green
    & "$scriptDir\venv\Scripts\python.exe" "$scriptDir\run.py"
} else {
    Write-Host "[INFO] Đang chạy với py launcher..." -ForegroundColor Yellow
    py "$scriptDir\run.py"
}

@echo off
setlocal
cd /d "%~dp0"
title BandKit Reset Cache and Start
set PORT=5199
set HOST=127.0.0.1

echo.
echo ==========================================
echo  BandKit MVP Shell - Reset Cache + Start
 echo ==========================================
echo  Folder: %CD%
echo  URL:    http://%HOST%:%PORT%
echo.
echo [INFO] This closes Node.js processes to release old local dev servers.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
if exist ".bandkit-local-cache" rmdir /s /q ".bandkit-local-cache"

echo [INFO] Old Node dev servers stopped. Starting BandKit preview...
echo.
call START_BANDKIT_PREVIEW.bat

@echo off
setlocal
cd /d "%~dp0"
title BandKit Dev Server
set PORT=5199
set HOST=127.0.0.1

echo.
echo ==========================================
echo  BandKit MVP Shell - Dev
 echo ==========================================
echo  Folder: %CD%
echo  URL:    http://%HOST%:%PORT%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Install Node.js LTS, reopen this window, then run again.
  pause
  exit /b 1
)

call npm install
if errorlevel 1 goto failed
call npm run dev
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo [ERROR] BandKit dev start failed. Scroll up and copy the error output.
pause
exit /b 1

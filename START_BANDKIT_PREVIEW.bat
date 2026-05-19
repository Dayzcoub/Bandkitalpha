@echo off
setlocal
cd /d "%~dp0"
title BandKit Preview Server
set PORT=5199
set HOST=127.0.0.1

echo.
echo ==========================================
echo  BandKit MVP Shell - Preview
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

if not exist "dist\index.html" (
  echo [INFO] dist/index.html not found. Building project first...
  call npm install
  if errorlevel 1 goto failed
  call npm run build
  if errorlevel 1 goto failed
)

start "" "http://%HOST%:%PORT%"
node scripts\serve-dist.mjs
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo [ERROR] BandKit preview failed. Scroll up and copy the error output.
pause
exit /b 1

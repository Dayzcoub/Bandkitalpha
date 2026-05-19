@echo off
setlocal
cd /d "%~dp0"
title BandKit Build

echo.
echo ==========================================
echo  BandKit MVP Shell - Build
 echo ==========================================
echo  Folder: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  pause
  exit /b 1
)

call npm install
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed

echo.
echo [OK] Build complete: dist\index.html
pause
exit /b 0

:failed
echo.
echo [ERROR] Build failed. Scroll up and copy the error output.
pause
exit /b 1

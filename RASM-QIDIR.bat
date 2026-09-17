@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs-portable\node-v22.23.2-win-x64;%PATH%"

echo ============================================
echo  Rentgen topilmalarini tekshirishga yuklash
echo ============================================
echo.
where node >nul 2>&1
if errorlevel 1 ( echo XATO: node topilmadi. & pause & exit /b 1 )

if "%~1"=="" ( set "FROM=0" ) else ( set "FROM=%~1" )

node scripts/fetch-open-images.js verify new %FROM% 8

echo.
echo ============================================
echo  TAYYOR. Claude'ga "tayyor" deb yozing.
echo ============================================
pause

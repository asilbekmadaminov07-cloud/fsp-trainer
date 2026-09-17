@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs-portable\node-v22.23.2-win-x64;%PATH%"

echo ============================================
echo  FSP Trainer - rentgen qidirish (3 ta holat)
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo XATO: node topilmadi.
  pause
  exit /b 1
)

set "OUT=rentgen.txt"
echo. > "%OUT%"

echo [1/3] Kevin - sut tishi kariesi rentgeni...
echo ##### KEVIN >> "%OUT%"
node scripts/fetch-open-images.js cat "Pediatric dentistry" >> "%OUT%" 2>&1
node scripts/fetch-open-images.js search "bitewing radiograph" >> "%OUT%" 2>&1

echo [2/3] Frau Wolter - MRONJ rentgeni...
echo ##### MRONJ >> "%OUT%"
node scripts/fetch-open-images.js cat "Medication-related osteonecrosis of the jaw" >> "%OUT%" 2>&1
node scripts/fetch-open-images.js search "osteonecrosis jaw radiograph" >> "%OUT%" 2>&1

echo [3/3] Herr Weber - aql tishi rentgeni...
echo ##### WEBER >> "%OUT%"
node scripts/fetch-open-images.js cat "Impacted teeth" >> "%OUT%" 2>&1
node scripts/fetch-open-images.js cat "Dental panoramic radiographs" >> "%OUT%" 2>&1

echo.
echo rentgen.txt yozildi.
echo ============================================
echo  TAYYOR. Claude'ga "tayyor" deb yozing.
echo ============================================
pause

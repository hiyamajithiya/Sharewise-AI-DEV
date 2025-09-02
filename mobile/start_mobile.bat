@echo off
echo ========================================
echo ShareWise AI Mobile Development Setup
echo ========================================
echo.

echo Checking environment...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Starting Metro bundler...
start cmd /k "cd %~dp0 && npm start"

echo.
echo Waiting for Metro bundler to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Mobile app is ready to run!
echo ========================================
echo.
echo Choose an option:
echo 1. Run on Android device/emulator
echo 2. Run on iOS simulator (Mac only)
echo 3. Just keep Metro running
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting Android app...
    echo Make sure you have an Android emulator running or device connected!
    echo.
    npm run android
) else if "%choice%"=="2" (
    echo.
    echo Starting iOS app...
    echo This requires macOS with Xcode installed.
    echo.
    npm run ios
) else (
    echo.
    echo Metro bundler is running. You can now run the app from Android Studio or Xcode.
)

echo.
echo ========================================
echo Development server is running!
echo ========================================
echo.
echo API URL: http://192.168.1.94:8000
echo Metro Bundler: http://localhost:8081
echo.
echo Press any key to exit...
pause >nul
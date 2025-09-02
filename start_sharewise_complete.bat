@echo off
echo ============================================
echo ShareWise AI Complete Development Setup
echo ============================================
echo.

echo [1/4] Starting Redis Server...
start cmd /k "redis-server"
timeout /t 2 /nobreak >nul

echo [2/4] Starting Django Backend Server...
start cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Development Server...
start cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul

echo [4/4] Setting up Mobile Development...
echo.
echo ============================================
echo All services are starting up...
echo ============================================
echo.
echo Backend API: http://localhost:8000
echo Frontend Web: http://localhost:3000
echo Redis: localhost:6379
echo.
echo For Mobile Development:
echo ------------------------
echo 1. Open a new terminal
echo 2. Navigate to the 'mobile' folder
echo 3. Run: npm start (for Metro bundler)
echo 4. In another terminal, run:
echo    - For Android: npm run android
echo    - For iOS: npm run ios
echo.
echo Mobile API configured to: http://192.168.1.94:8000
echo.
echo ============================================
echo Setup Complete! All services are running.
echo ============================================
echo.
pause
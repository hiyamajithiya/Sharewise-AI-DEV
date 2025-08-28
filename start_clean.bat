@echo off
echo ========================================
echo ShareWise AI Clean Start Script
echo ========================================

echo.
echo Killing any existing Node/Python processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Django Backend Server on port 8000...
start "Django Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 8000"

echo Waiting for Django to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Starting React Frontend Server on port 3000...
start "React Frontend" cmd /k "cd /d %~dp0frontend && set PORT=3000 && npm start"

echo.
echo ========================================
echo SERVERS STARTING...
echo ========================================
echo Please wait 30-60 seconds for full startup
echo.
echo Frontend URL: http://localhost:3000/
echo Backend API:  http://localhost:8000/api/
echo Admin Panel:  http://localhost:8000/admin/
echo.
echo Login Credentials:
echo Email: chinmaytechnosoft@gmail.com
echo Password: Chinmay123
echo.
echo ========================================
pause
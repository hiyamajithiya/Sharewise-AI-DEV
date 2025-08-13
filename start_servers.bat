@echo off
echo ========================================
echo Starting ShareWise AI Servers
echo ========================================

echo.
echo Starting Django Backend Server...
start "Django Backend" cmd /c "cd /d %~dp0backend && python manage.py runserver 8000"

echo Waiting for Django to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting React Frontend Server...
start "React Frontend" cmd /c "cd /d %~dp0frontend && npm start"

echo.
echo Servers are starting up...
echo This may take 30-60 seconds.
echo.
echo ========================================
echo LOGIN CREDENTIALS
echo ========================================
echo Email: chinmaytechnosoft@gmail.com
echo Password: Chinmay123
echo.
echo ========================================
echo ACCESS POINTS
echo ========================================
echo Web App:     http://localhost:3001/
echo Admin Panel: http://localhost:8000/admin/
echo API Docs:    http://localhost:8000/api/
echo.
echo Press any key to close this window...
pause >nul
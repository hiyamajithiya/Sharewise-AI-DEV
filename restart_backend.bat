@echo off
echo ========================================
echo Restarting ShareWise AI Backend Server
echo ========================================

echo.
echo Stopping existing Django server processes...
taskkill /F /IM python.exe 2>NUL
timeout /t 2 /nobreak >nul

echo.
echo Installing missing dependencies...
cd /d "%~dp0backend"
python -m pip install django-debug-toolbar --quiet

echo.
echo Running database migrations...
python manage.py migrate

echo.
echo Starting Django Backend Server...
start "Django Backend" cmd /c "python manage.py runserver 127.0.0.1:8000"

echo.
echo Backend server is starting up...
echo This may take 10-20 seconds.
echo.
echo ========================================
echo Backend server restarted successfully!
echo ========================================
echo.
echo Access Points:
echo Web Admin: http://127.0.0.1:8000/admin/
echo API Base:  http://127.0.0.1:8000/api/
echo.
echo Press any key to close this window...
pause >nul
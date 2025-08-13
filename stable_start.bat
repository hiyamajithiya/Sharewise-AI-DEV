@echo off
echo ========================================
echo ShareWise AI - Stable Server Startup
echo ========================================

rem Change to the project directory
cd /d "%~dp0"

rem Function to check if a process is running
echo.
echo [1/5] Checking for existing servers...

rem Kill existing processes more reliably
for /f "tokens=1" %%p in ('wmic process where "commandline like '%%runserver%%' or commandline like '%%npm start%%'" get processid /value ^| find "ProcessId"') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do (
        if not "%%i"=="" (
            echo Stopping process %%i
            taskkill /PID %%i /F >nul 2>&1
        )
    )
)

rem Wait for processes to fully terminate
timeout /t 3 /nobreak >nul

echo.
echo [2/5] Installing critical dependencies...

rem Install missing packages that cause crashes
cd /d "%~dp0backend"
python -m pip install --quiet --no-warn-script-location django-debug-toolbar aiohttp scikit-learn pandas

echo.
echo [3/5] Running database migrations...
python manage.py migrate --run-syncdb

echo.
echo [4/5] Starting backend server...
start "ShareWise AI Backend" /min cmd /c "python manage.py runserver 127.0.0.1:8000 && pause"

rem Wait for Django to start
timeout /t 8 /nobreak >nul

echo.
echo [5/5] Starting frontend server...
cd /d "%~dp0frontend"
start "ShareWise AI Frontend" /min cmd /c "npm start && pause"

echo.
echo ========================================
echo ✅ SERVERS STARTED SUCCESSFULLY
echo ========================================
echo.
echo 🌐 Web Application: http://localhost:3001/
echo 🔧 Admin Panel:     http://localhost:8000/admin/
echo 📡 API Base:        http://localhost:8000/api/
echo.
echo 🔑 Demo Login Credentials:
echo    Basic: demo@basic.com / demo123
echo    Pro:   demo@pro.com / demo123
echo    Elite: demo@elite.com / demo123
echo.
echo ⚠️  To avoid crashes, always use this script to start servers
echo ⚠️  Don't install packages while servers are running
echo.
echo Servers are starting in minimized windows...
echo This window will close in 10 seconds.
timeout /t 10 /nobreak >nul
@echo off
echo ========================================
echo Installing ShareWise AI Dependencies
echo ========================================

echo.
echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Setting npm configuration...
npm config set registry https://registry.npmjs.org/
npm config set timeout 600000
npm config set network-timeout 600000

echo.
echo Step 3: Installing core packages...
call npm install react@^18.3.1 react-dom@^18.3.1 react-scripts@5.0.1 --save

echo.
echo Step 4: Installing Material-UI...
call npm install @mui/material@^5.15.21 @emotion/react@^11.11.4 @emotion/styled@^11.11.5 --save

echo.
echo Step 5: Installing Material-UI Icons...
call npm install @mui/icons-material@^5.15.21 --save

echo.
echo Step 6: Installing Redux and Router...
call npm install @reduxjs/toolkit@^2.2.7 react-redux@^9.1.2 redux-persist@^6.0.0 --save
call npm install react-router-dom@^6.24.1 --save

echo.
echo Step 7: Installing utilities...
call npm install axios@^1.7.2 typescript@^4.9.5 --save

echo.
echo Step 8: Installing dev dependencies...
call npm install @types/react@^18.3.3 @types/react-dom@^18.3.0 @types/node@^16.18.101 @types/jest@^27.5.2 web-vitals@^2.1.4 --save

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo If installation succeeded, run:
echo   npm run build
echo.
echo If it failed, try the alternative methods in install-fix.md
echo.
pause
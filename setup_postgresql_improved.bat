@echo off
setlocal enabledelayedexpansion

echo ============================================
echo      ShareWise AI PostgreSQL Setup
echo ============================================
echo.

echo Step 1: Setting up PostgreSQL database and user...
echo You will be prompted for the PostgreSQL "postgres" user password
echo.

REM Set PGPASSWORD environment variable for automation (comment out if you prefer interactive)
REM set PGPASSWORD=your_postgres_password_here

echo Creating database...
"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres -h localhost sharewise_ai_dev
if %errorlevel% neq 0 (
    echo Error creating database. Check if PostgreSQL is running and credentials are correct.
    pause
    exit /b 1
)

echo Creating user...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d postgres -c "CREATE USER sharewise_user WITH PASSWORD 'Chinmay123';"
if %errorlevel% neq 0 (
    echo Warning: User might already exist or there was an error.
)

echo Granting privileges...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE sharewise_ai_dev TO sharewise_user;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -d postgres -c "ALTER USER sharewise_user CREATEDB;"

echo.
echo ============================================
echo   Database setup completed successfully!
echo ============================================
echo.
echo Database Details:
echo   Database Name: sharewise_ai_dev
echo   Username: sharewise_user
echo   Password: Chinmay123
echo   Host: localhost
echo   Port: 5432
echo.
echo Next steps:
echo 1. Run: migrate_to_postgresql.bat
echo 2. Start development with PostgreSQL backend
echo.
pause

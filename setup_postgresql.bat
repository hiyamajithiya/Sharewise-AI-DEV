REM PostgreSQL Database Setup Script
REM Run this as Administrator

echo Creating ShareWise AI Database...

"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres sharewise_ai_dev

echo Creating database user...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "CREATE USER sharewise_user WITH PASSWORD 'Chinmay123';"

echo Granting privileges...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE sharewise_ai_dev TO sharewise_user;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "ALTER USER sharewise_user CREATEDB;"

echo Database setup complete!
echo.
echo Database Details:
echo   Database Name: sharewise_ai_dev
echo   Username: sharewise_user  
echo   Password: Chinmay123
echo   Host: localhost
echo   Port: 5432
echo.
pause

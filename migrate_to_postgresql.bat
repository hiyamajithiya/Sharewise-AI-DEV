REM Django Migration Script for PostgreSQL
REM Run this after setting up the database

echo Switching to backend directory...
cd /d "C:\Users\ADMIN\Documents\Chinmay Technosoft Work\Sharewise-AI-DEVnew-repo\backend"

echo Installing/updating requirements...
pip install -r requirements/development.txt

echo Running Django migrations...
python manage.py migrate

echo Creating superuser...
python manage.py create_superadmin

echo Starting development server...
python manage.py runserver

pause

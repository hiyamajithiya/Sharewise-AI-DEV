# PostgreSQL Setup Guide for ShareWise AI

## Overview
ShareWise AI now uses PostgreSQL as the primary database. Follow these steps to complete the setup.

## Step 1: Database Setup (REQUIRED)
Run the PostgreSQL setup script as Administrator:

```batch
setup_postgresql.bat
```

**What this does:**
- Creates database: `sharewise_ai_dev`
- Creates user: `sharewise_user` with password `Chinmay123`
- Grants all necessary privileges

**You will be prompted for the PostgreSQL 'postgres' user password during setup.**

## Step 2: Django Migration
Run the Django migration script:

```batch
migrate_to_postgresql.bat
```

**What this does:**
- Installs Python dependencies
- Runs Django migrations to create tables
- Creates superuser account
- Starts development server

## Step 3: Verify Setup
1. Check that the server starts without errors
2. Visit `http://localhost:8000/admin/`
3. Login with:
   - Email: `chinmaytechnosoft@gmail.com`
   - Password: `Chinmay123`

## Database Configuration
The following environment variables are configured in `.env`:

```env
DB_NAME=sharewise_ai_dev
DB_USER=sharewise_user
DB_PASSWORD=Chinmay123
DB_HOST=localhost
DB_PORT=5432
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL service is running
- Check Windows Services for `postgresql-x64-17`
- Verify firewall isn't blocking port 5432

### Authentication Issues
- Make sure you know the PostgreSQL 'postgres' user password
- If you forgot it, you may need to reset it via PostgreSQL configuration

### Migration Issues
- Delete `db.sqlite3` if it exists
- Ensure all requirements are installed: `pip install -r requirements/development.txt`

## Production Notes
For production deployment:
- Use environment-specific database names
- Use strong, unique passwords
- Consider connection pooling
- Set up SSL connections
- Configure regular backups

## Next Steps
1. Run `setup_postgresql.bat` (as Administrator)
2. Run `migrate_to_postgresql.bat`
3. Test the application
4. Begin development with PostgreSQL backend

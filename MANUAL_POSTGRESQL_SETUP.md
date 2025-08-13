# Manual PostgreSQL Setup Instructions

Since automated setup requires interactive password input, please follow these manual steps:

## Option 1: Using pgAdmin (Recommended)
1. Open pgAdmin (PostgreSQL graphical interface)
2. Connect to your PostgreSQL server
3. Right-click on 'Databases' → Create → Database
   - Name: sharewise_ai_dev
4. Right-click on 'Login/Group Roles' → Create → Login/Group Role
   - General tab: Name = sharewise_user
   - Definition tab: Password = Chinmay123
   - Privileges tab: Check 'Can login?' and 'Create databases?'
5. Right-click on 'sharewise_ai_dev' → Properties → Security
   - Add sharewise_user with ALL privileges

## Option 2: Using SQL Shell (psql)
1. Open 'SQL Shell (psql)' from Start Menu
2. Press Enter for defaults (Server, Database, Port, Username)
3. Enter password: Chinmay123
4. Run these commands:

```sql
CREATE DATABASE sharewise_ai_dev;
CREATE USER sharewise_user WITH PASSWORD 'Chinmay123';
GRANT ALL PRIVILEGES ON DATABASE sharewise_ai_dev TO sharewise_user;
ALTER USER sharewise_user CREATEDB;
\q
```

## Option 3: Command Line with Authentication File
1. Create file: C:\Users\ADMIN\AppData\Roaming\postgresql\pgpass.conf
2. Add line: localhost:5432:*:postgres:Chinmay123
3. Run: createdb -U postgres -h localhost sharewise_ai_dev
4. Run: psql -U postgres -h localhost -c "CREATE USER sharewise_user WITH PASSWORD 'Chinmay123';"

## Verify Setup
Once database is created, run:
```batch
migrate_to_postgresql.bat
```

This will test the connection and run Django migrations.

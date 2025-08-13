CREATE DATABASE sharewise_ai_dev;
CREATE USER sharewise_user WITH PASSWORD 'Chinmay123';
GRANT ALL PRIVILEGES ON DATABASE sharewise_ai_dev TO sharewise_user;
ALTER USER sharewise_user CREATEDB;
\q

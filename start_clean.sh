#!/bin/bash

echo "========================================"
echo "ShareWise AI Clean Start Script"
echo "========================================"

echo ""
echo "Killing any existing Node/Python processes..."
pkill -f "node.*react-scripts" 2>/dev/null
pkill -f "python.*manage.py" 2>/dev/null
sleep 2

echo ""
echo "Starting Django Backend Server on port 8000..."
cd backend
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

echo "Waiting for Django to initialize..."
sleep 5

echo ""
echo "Starting React Frontend Server on port 3000..."
cd frontend
PORT=3000 npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "SERVERS STARTING..."
echo "========================================"
echo "Please wait 30-60 seconds for full startup"
echo ""
echo "Frontend URL: http://localhost:3000/"
echo "Backend API:  http://localhost:8000/api/"
echo "Admin Panel:  http://localhost:8000/admin/"
echo ""
echo "Login Credentials:"
echo "Email: chinmaytechnosoft@gmail.com"
echo "Password: Chinmay123"
echo ""
echo "========================================"
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
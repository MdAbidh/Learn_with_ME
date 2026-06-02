@echo off
REM Learning Platform - Complete Setup Guide (Windows)
REM =================================================

echo 🚀 Setting up Learning Platform...

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
call npm install --prefix backend
call npm install --prefix frontend

REM Step 2: Create environment files
echo 📝 Creating environment files...

REM Frontend .env.local
(
echo REACT_APP_API_URL=http://localhost:5000/api
echo REACT_APP_ENV=development
) > learning-platform\frontend\.env.local

REM Backend .env
(
echo PORT=5000
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
) > learning-platform\backend\.env

REM Root .env
(
echo # Frontend
echo REACT_APP_API_URL=http://localhost:5000/api
echo REACT_APP_ENV=development
echo.
echo # Backend
echo PORT=5000
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
) > learning-platform\.env

echo ✅ Environment files created!
echo.
echo 📋 Environment Configuration:
echo ================================
echo Frontend API URL: http://localhost:5000/api
echo Backend Port: 5000
echo Frontend Port: 3000
echo.
echo 🎉 Setup complete! Run: npm run dev
pause

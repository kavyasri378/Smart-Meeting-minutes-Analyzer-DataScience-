@echo off
title Smart Meeting Minutes Analyzer (MinuteFlow AI)
echo ========================================================
echo   Starting Smart Meeting Minutes Analyzer (MinuteFlow)
echo ========================================================
echo.

cd /d "%~dp0"

REM Step 1: Check Backend Virtual Environment
if not exist "backend\venv\Scripts\python.exe" (
    echo [Setup] Backend virtual environment not found. Creating backend\venv ...
    py -3.12 -m venv backend\venv 2>nul || python -m venv backend\venv
    echo [Setup] Installing backend dependencies ...
    .\backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)

REM Step 2: Check Frontend Dependencies
if not exist "frontend\node_modules" (
    echo [Setup] Frontend node_modules not found. Installing npm dependencies ...
    cd /d "%~dp0frontend"
    npm install
    cd /d "%~dp0"
)

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "MinuteFlow Backend API" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Vite Frontend on http://localhost:5173 ...
start "MinuteFlow React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo Opening Browser...
start http://localhost:5173/

echo.
echo ========================================================
echo   Both services are now running successfully!
echo   Frontend Application: http://localhost:5173/
echo   Interactive API Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause

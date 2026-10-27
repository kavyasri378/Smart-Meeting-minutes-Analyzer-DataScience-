@echo off
title MinuteFlow AI - Automated Test Suite
echo ========================================================
echo   Running MinuteFlow AI Complete Test Suite
echo ========================================================
echo.

if exist "backend\venv\Scripts\python.exe" (
    .\backend\venv\Scripts\python.exe backend\run_all_tests.py
) else (
    python backend\run_all_tests.py
)

echo.
pause

@echo off
title Personal Finance Advisor Bot 💰
echo =========================================================
echo       Personal Finance Advisor Bot 💰
echo   Smart Budgeting & AI-Driven Savings Insights
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/3] Detecting Python environment...
py -3.13 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PY_CMD=py -3.13
) else (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PY_CMD=py
    ) else (
        set PY_CMD=python
    )
)

echo Using Python command: %PY_CMD%
echo.

echo [2/3] Checking dependencies (Flask)...
%PY_CMD% -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Flask not found. Automatically installing requirements...
    %PY_CMD% -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo Error installing dependencies. Please ensure pip is available.
        pause
        exit /b 1
    )
) else (
    echo Flask is already installed.
)
echo.

echo [3/3] Starting Flask application on http://127.0.0.1:5000 ...
echo The web browser will open automatically.
echo (Press Ctrl+C in this window to stop the server)
echo.

timeout /t 2 /nobreak >nul
start http://127.0.0.1:5000

%PY_CMD% app.py

pause

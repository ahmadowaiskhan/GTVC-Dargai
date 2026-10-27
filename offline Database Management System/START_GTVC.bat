@echo off
setlocal enabledelayedexpansion
title GTVC Dargai - Offline DBMS Starter
color 0B

echo ========================================
echo   GTVC Dargai Offline DBMS Launcher
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if XAMPP MySQL exists
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo [INFO] XAMPP MySQL found at C:\xampp\mysql\bin\
    REM Check if MySQL is already running
    tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | find /I "mysqld.exe" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] Starting MySQL...
        start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        echo [INFO] Waiting for MySQL to initialize (15 seconds)...
        timeout /t 15 /nobreak >nul
    ) else (
        echo [INFO] MySQL is already running.
    )
) else (
    echo [WARNING] XAMPP not found at C:\xampp\. 
    echo Make sure MySQL/MariaDB is running separately (or use standalone MySQL service).
    timeout /t 3 /nobreak >nul
)

REM Check node_modules
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install --no-audit --no-fund
    echo.
)

REM Start the Node.js server in a new window
echo [INFO] Starting GTVC Server...
start "GTVC Server" cmd /k "cd /d "%~dp0" && npm start"

REM Wait for server to start
echo [INFO] Waiting for server to start (8 seconds)...
timeout /t 8 /nobreak >nul

REM Open website in default browser
echo [INFO] Opening website in browser...
start "" "http://localhost:3000"

echo.
echo ========================================
echo   Server should be running at http://localhost:3000
echo   A separate "GTVC Server" window has been opened
echo   Close that window to stop the server
echo ========================================
echo.
pause

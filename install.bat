@echo off
setlocal enabledelayedexpansion

:: Define basic mock colors using bracket notation for readability
echo [INFO] === OdooHack Full-Stack Setup ===
echo [INFO] Checking prerequisites...

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [31m[ERROR] Node.js is not installed or not in PATH. Please install Node.js (Preferred: v22.22.1). [0m
    exit /b 1
)

:: Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [31m[ERROR] npm is not installed or not in PATH. Please install npm (Preferred: 10.9.4). [0m
    exit /b 1
)

:: Check for PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [31m[ERROR] PostgreSQL (psql command) is not installed or not in PATH. Please install PostgreSQL (Preferred: 18.4). [0m
    exit /b 1
)

echo  [32m[SUCCESS] All prerequisites are installed! [0m
echo.

echo [INFO] Installing Backend Dependencies...
cd backend
call npm install
echo [INFO] Generating Prisma Client...
call npx prisma generate
cd ..

echo [INFO] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [32m====================================[0m
echo [32m  Setup Completed Successfully!     [0m
echo [32m====================================[0m
echo.

echo [COMMANDS] To run the backend, open a terminal and run:
echo   cd backend
echo   npm run dev
echo.

echo [COMMANDS] To run the frontend, open a second terminal and run:
echo   cd frontend
echo   npm run dev
echo.
pause

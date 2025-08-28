@echo off
title Auto Git Watcher - BrandBond Project
color 0A

echo.
echo ========================================
echo    🚀 Auto Git Watcher Starter
echo ========================================
echo.
echo 📁 Project: BrandBond
echo 🔗 Repository: https://github.com/invincx-corp/BrandBond.git
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo 💡 Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Not in project directory! Please run this script from the BrandBond project root.
    pause
    exit /b 1
)

REM Check if chokidar is installed
if not exist "node_modules\chokidar" (
    echo 📦 Installing chokidar dependency...
    npm install chokidar
    if %errorlevel% neq 0 (
        echo ❌ Failed to install chokidar
        pause
        exit /b 1
    )
    echo ✅ chokidar installed successfully
)

echo.
echo 🎯 Starting Auto Git Watcher...
echo 💡 Any file changes will be automatically committed and pushed to GitHub!
echo 🛑 Press Ctrl+C to stop the watcher
echo.

REM Start the auto-git watcher
node auto-git-watcher.js

pause

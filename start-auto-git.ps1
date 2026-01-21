# Auto Git Watcher Starter Script
# This script starts the automatic GitHub commit and push system

Write-Host "🚀 Starting Auto Git Watcher..." -ForegroundColor Green
Write-Host "📁 Project: BrandBond" -ForegroundColor Cyan
Write-Host "🔗 Repository: https://github.com/invincx-corp/BrandBond.git" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    Write-Host "💡 Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Not in project directory! Please run this script from the BrandBond project root." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if chokidar is installed
if (-not (Test-Path "node_modules\chokidar")) {
    Write-Host "📦 Installing chokidar dependency..." -ForegroundColor Yellow
    try {
        npm install chokidar
        Write-Host "✅ chokidar installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install chokidar" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check git status
Write-Host "🔍 Checking git status..." -ForegroundColor Cyan
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📝 Found uncommitted changes:" -ForegroundColor Yellow
        $gitStatus | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        Write-Host ""
        Write-Host "💡 These changes will be committed automatically when the watcher starts!" -ForegroundColor Cyan
    } else {
        Write-Host "✅ Working directory is clean" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Git not found or not initialized!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎯 Starting Auto Git Watcher..." -ForegroundColor Green
Write-Host "💡 Any file changes will be automatically committed and pushed to GitHub!" -ForegroundColor Cyan
Write-Host "🛑 Press Ctrl+C to stop the watcher" -ForegroundColor Yellow
Write-Host ""

# Start the auto-git watcher
try {
    node auto-git-watcher.cjs
} catch {
    Write-Host "❌ Error starting Auto Git Watcher: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

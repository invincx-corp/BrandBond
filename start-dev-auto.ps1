Write-Host "🚀 Starting BrandBond Development Auto-Runner..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will automatically compile and run your project after every change." -ForegroundColor Yellow
Write-Host "The development server will restart automatically when files are modified." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the development server." -ForegroundColor Green
Write-Host ""

try {
    node dev-auto.js
}
catch {
    Write-Host "❌ Error starting development server: $_" -ForegroundColor Red
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

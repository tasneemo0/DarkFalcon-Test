# ============================================
# TrustChat Backend - Start Server (Windows)
# ============================================
# شغّل هذا السكربت لبدء السيرفر
# ============================================

param(
    [int]$Port = 8000
)

$DeployDir = "C:\TrustChat\backend"
Set-Location $DeployDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TrustChat Backend Server              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server on port $Port..." -ForegroundColor Green
Write-Host "API URL: http://0.0.0.0:$Port" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

# Start with Waitress (Windows-compatible WSGI server)
& "$DeployDir\venv\Scripts\python.exe" -c "from waitress import serve; from darkfalcon.wsgi import application; print('Server running on http://0.0.0.0:$Port'); serve(application, host='0.0.0.0', port=$Port, threads=4)"

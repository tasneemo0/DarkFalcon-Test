# ============================================
# TrustChat Backend - Windows RDP Deploy Script
# ============================================
# شغّل هذا السكربت مرة واحدة لإعداد الـ Backend
# Run this script once to set up the Backend
# ============================================

param(
    [string]$ServerIP = "YOUR_RDP_IP_HERE",
    [int]$Port = 8000
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TrustChat Backend - Deployment Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Set deployment directory
$DeployDir = "C:\TrustChat\backend"

if (Test-Path $DeployDir) {
    Write-Host "[!] Directory exists. Pulling latest code..." -ForegroundColor Yellow
    Set-Location $DeployDir
    git pull origin main
} else {
    Write-Host "[1/7] Cloning repository..." -ForegroundColor Green
    New-Item -ItemType Directory -Path "C:\TrustChat" -Force | Out-Null
    git clone https://github.com/moooonu/trustchat-backend.git $DeployDir
    Set-Location $DeployDir
}

# 2. Create virtual environment
Write-Host "[2/7] Creating virtual environment..." -ForegroundColor Green
if (-Not (Test-Path "$DeployDir\venv")) {
    python -m venv venv
}

# 3. Activate venv and install dependencies
Write-Host "[3/7] Installing dependencies..." -ForegroundColor Green
& "$DeployDir\venv\Scripts\pip.exe" install -r requirements.txt

# 4. Create .env file
Write-Host "[4/7] Creating .env configuration..." -ForegroundColor Green
$SecretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object { [char]$_ })

$EnvContent = @"
# TrustChat Backend - Production Configuration
DEBUG=False
SECRET_KEY=$SecretKey

ALLOWED_HOSTS=$ServerIP,localhost,127.0.0.1

DATABASE_URL=sqlite:///db.sqlite3

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=https://trustchat-frontend.vercel.app,http://localhost:3000
CSRF_TRUSTED_ORIGINS=https://trustchat-frontend.vercel.app,http://${ServerIP}:${Port}

META_VERIFY_TOKEN=darkfalcon_verify_token_123
"@

Set-Content -Path "$DeployDir\.env" -Value $EnvContent -Encoding UTF8
Write-Host "    .env file created with auto-generated SECRET_KEY" -ForegroundColor DarkGray

# 5. Run migrations
Write-Host "[5/7] Running database migrations..." -ForegroundColor Green
& "$DeployDir\venv\Scripts\python.exe" manage.py migrate --noinput

# 6. Collect static files
Write-Host "[6/7] Collecting static files..." -ForegroundColor Green
& "$DeployDir\venv\Scripts\python.exe" manage.py collectstatic --noinput

# 7. Create superuser prompt
Write-Host "[7/7] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!                  " -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server IP: $ServerIP" -ForegroundColor White
Write-Host "Port: $Port" -ForegroundColor White
Write-Host "API URL: http://${ServerIP}:${Port}" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Create admin user:" -ForegroundColor White
Write-Host "     cd $DeployDir" -ForegroundColor Gray
Write-Host "     venv\Scripts\python.exe manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the server:" -ForegroundColor White
Write-Host "     .\start_server.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Update Vercel env variable NEXT_PUBLIC_API_URL to:" -ForegroundColor White
Write-Host "     http://${ServerIP}:${Port}" -ForegroundColor Yellow
Write-Host ""

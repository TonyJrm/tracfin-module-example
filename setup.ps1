#!/usr/bin/env pwsh
# TracFin Module - Setup Script for Windows
# Automatically installs and configures the project

Write-Host "🎰 TracFin Module - Automatic setup" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Node.js
try {
  $nodeVersion = node --version
  Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
}
catch {
  Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
  Write-Host "   Download it at https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}

# pnpm
try {
  $pnpmVersion = pnpm --version
  Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  pnpm is not installed. Installing..." -ForegroundColor Yellow
  npm install -g pnpm
  Write-Host "✅ pnpm installed successfully" -ForegroundColor Green
}

# Docker
try {
  $dockerVersion = docker --version
  Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
}
catch {
  Write-Host "❌ Docker is not installed!" -ForegroundColor Red
  Write-Host "   Download Docker Desktop at https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
  exit 1
}

# Check that Docker is running
try {
  docker ps | Out-Null
  Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
}
catch {
  Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
  Write-Host "   Start Docker Desktop then re-run this script" -ForegroundColor Yellow
  exit 1
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Error while installing dependencies" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Dependencies installed successfully`n" -ForegroundColor Green

Write-Host "🐳 Starting PostgreSQL..." -ForegroundColor Yellow
pnpm run db:up

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Error while starting PostgreSQL" -ForegroundColor Red
  exit 1
}

Write-Host "⏳ Waiting for PostgreSQL to start (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check that PostgreSQL is ready
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$connected = $false

while (-not $connected -and $attempt -lt $maxAttempts) {
  $attempt++
  try {
    docker compose exec -T postgres pg_isready -U tracfin_user | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $connected = $true
      Write-Host "✅ PostgreSQL is ready!`n" -ForegroundColor Green
    }
    else {
      Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
      Start-Sleep -Seconds 3
    }
  }
  catch {
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
  }
}

if (-not $connected) {
  Write-Host "❌ Unable to connect to PostgreSQL" -ForegroundColor Red
  Write-Host "   Check logs with: pnpm run db:logs" -ForegroundColor Yellow
  exit 1
}

Write-Host "🌱 Generating 40,000 players and their data..." -ForegroundColor Yellow
Write-Host "   ⏱️  This may take 3-7 minutes depending on your machine`n" -ForegroundColor Gray

pnpm run db:seed:build

if ($LASTEXITCODE -ne 0) {
  Write-Host "`n❌ Error while generating data" -ForegroundColor Red
  exit 1
}

Write-Host "`n✨ Setup completed successfully!`n" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Start the Next.js application:" -ForegroundColor Yellow
Write-Host "    pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Open in your browser:" -ForegroundColor Yellow
Write-Host "    http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Access pgAdmin (DB web interface):" -ForegroundColor Yellow
Write-Host "    http://localhost:5050" -ForegroundColor White
Write-Host "    Email: admin@example.com" -ForegroundColor Gray
Write-Host "    Password: admin" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Full documentation:" -ForegroundColor Yellow
Write-Host "    README.md" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Useful commands:" -ForegroundColor Yellow
Write-Host "    pnpm run db:logs    # View PostgreSQL logs" -ForegroundColor Gray
Write-Host "    pnpm run db:down    # Stop the database" -ForegroundColor Gray
Write-Host "    pnpm run db:reset   # Full database reset" -ForegroundColor Gray
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ All set! Happy coding! 🚀" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

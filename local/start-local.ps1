# GK Parfum - start the admin panel (port 9000) and the website (port 3000) on this PC.
$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root "backend\apps\backend"
$store = Join-Path $root "storefront"

Write-Host "Starting the admin panel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='GK admin (keep open)'; Set-Location '$app'; npx medusa develop"

Write-Host "Waiting for the admin to come up (about 30-60 seconds)..."
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 3
  try { if ((Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:9000/health" -TimeoutSec 3).StatusCode -eq 200) { $ok = $true; break } } catch {}
}
if (-not $ok) { Write-Host "The admin is taking longer than usual - check the 'GK admin' window for errors." -ForegroundColor Red }

Write-Host "Starting the website..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='GK website (keep open)'; Set-Location '$store'; npm run dev"
Start-Sleep -Seconds 12

Start-Process "http://localhost:9000/app"
Start-Process "http://localhost:3000"
Write-Host ""
Write-Host "Admin:   http://localhost:9000/app" -ForegroundColor Green
Write-Host "Website: http://localhost:3000" -ForegroundColor Green
Write-Host "To stop, close the two 'GK' windows."

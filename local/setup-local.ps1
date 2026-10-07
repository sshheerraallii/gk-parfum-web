# GK Parfum - one-time setup on a Windows PC (admin panel + website, running locally).
# Needs: Node.js 22 LTS and PostgreSQL 16 installed first. Redis is NOT needed locally.
# Run by double-clicking local\setup-local.bat

# Native tools write progress to stderr; handle failures via exit codes instead.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$app = Join-Path $backend "apps\backend"
$store = Join-Path $root "storefront"

function Step($t) { Write-Host ""; Write-Host "==> $t" -ForegroundColor Yellow }
function Fail($t) { Write-Host ""; Write-Host "STOPPED: $t" -ForegroundColor Red; Read-Host "Press Enter to close"; exit 1 }

Step "Checking Node.js"
try { $v = (node -v) } catch { Fail "Node.js isn't installed. Get the LTS version (22) from https://nodejs.org, then run this again." }
$major = [int]($v.TrimStart("v").Split(".")[0])
if ($major -lt 22) { Fail "Node.js $v is too old. Install Node.js 22 LTS from https://nodejs.org, then run this again." }
Write-Host "Node $v OK"

Step "Database password"
Write-Host "Enter the password you chose for the 'postgres' user when installing PostgreSQL."
$sec = Read-Host "Postgres password" -AsSecureString
$pg = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$pgEnc = [Uri]::EscapeDataString($pg)
$dbUrl = "postgres://postgres:${pgEnc}@localhost:5432/gk_medusa"

function Rand() { -join ((1..48) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) }) }

Step "Writing backend settings"
$envFile = Join-Path $app ".env"
@"
DATABASE_URL=$dbUrl
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000,http://localhost:3000
JWT_SECRET=$(Rand)
COOKIE_SECRET=$(Rand)
AUTH_MFA_ENCRYPTION_KEY=$(Rand)$(Rand)
MEDUSA_ADMIN_ONBOARDING_TYPE=default
"@ | Set-Content -Path $envFile -Encoding ascii
Write-Host "Saved $envFile"

Step "Installing backend packages (a few minutes the first time)"
Push-Location $backend
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install failed for the backend. Scroll up for the error." }
Pop-Location

Step "Creating the database"
Push-Location $app
npx medusa db:create --db gk_medusa --no-interactive 2>&1 | Out-Host
# db:create appends DB_NAME to .env; harmless, but keep the file clean
(Get-Content $envFile) | Where-Object { $_ -notmatch "^DB_NAME=" } | Set-Content $envFile -Encoding ascii

Step "Setting up tables and loading the 16 GK scents"
npx medusa db:migrate 2>&1 | Tee-Object -Variable migrateOut | Out-Host
$text = ($migrateOut | Out-String)
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Database setup failed. Check the Postgres password and that PostgreSQL is running." }
$pk = [regex]::Match($text, "pk_[a-f0-9]{20,}").Value

Step "Create your admin login"
$email = Read-Host "Admin email"
$secA = Read-Host "Admin password (8+ characters)" -AsSecureString
$adminPw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secA))
npx medusa user -e $email -p $adminPw 2>&1 | Out-Host
Pop-Location

if (-not $pk) {
  Write-Host "Couldn't read the publishable key automatically (the database was probably set up before)." -ForegroundColor Yellow
  Write-Host "Find it in the admin: Settings > Publishable API keys, then paste it here."
  $pk = Read-Host "Publishable key (starts with pk_)"
}

Step "Writing website settings"
@"
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$pk
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_KEY=
"@ | Set-Content -Path (Join-Path $store ".env.local") -Encoding ascii

Step "Installing website packages"
Push-Location $store
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install failed for the website. Scroll up for the error." }
Pop-Location

Write-Host ""
Write-Host "All set. Double-click local\start-local.bat to run the admin and the website." -ForegroundColor Green
Read-Host "Press Enter to close"

# deploy.ps1 — Chạy file này sau khi đã đăng nhập gh và vercel
# Usage: .\deploy.ps1 -RepoName "team-progress-tracker"

param(
    [string]$RepoName = "team-progress-tracker"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== STEP 1: Tao GitHub repo ===" -ForegroundColor Cyan

# Create GitHub repo (private by default)
gh repo create $RepoName --private --source=. --remote=origin --push
if ($LASTEXITCODE -ne 0) {
    # Repo might already exist, just set remote and push
    $ghUser = (gh api user --jq '.login' 2>$null)
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$ghUser/$RepoName.git"
    git push -u origin master
}

Write-Host ""
Write-Host "=== STEP 2: Deploy len Vercel ===" -ForegroundColor Cyan

# Load env vars from .env.local (never hardcode secrets in scripts!)
$envFile = Join-Path $PSScriptRoot ".env.local"
if (-not (Test-Path $envFile)) { Write-Error ".env.local not found"; exit 1 }
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
    }
}
$supaUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supaKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

# Link and deploy to Vercel with env vars
vercel --prod `
    --yes `
    --env NEXT_PUBLIC_SUPABASE_URL="$supaUrl" `
    --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$supaKey"

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "App da deploy len Vercel thanh cong!" -ForegroundColor Green

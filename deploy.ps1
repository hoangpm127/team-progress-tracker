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

# Link and deploy to Vercel with env vars
vercel --prod `
    --yes `
    --env NEXT_PUBLIC_SUPABASE_URL="https://sdcfgcchvxevgpozachn.supabase.co" `
    --env NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY2ZnY2Nodnhldmdwb3phY2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTQxMzMsImV4cCI6MjA4NzQ5MDEzM30.SGIm35pUq3qm0ghynGZQYxVlHm9YakpqRJQoCb60WHk"

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "App da deploy len Vercel thanh cong!" -ForegroundColor Green

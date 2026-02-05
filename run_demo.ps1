$ErrorActionPreference = 'Stop'

Write-Host "Starting FastAPI backend..." -ForegroundColor Cyan
$venvActivate = Join-Path (Get-Location) ".venv\\Scripts\\Activate.ps1"
$backendCmd = @"
if (Test-Path '$venvActivate') {
  . '$venvActivate'
} else {
  Write-Host 'Warning: .venv not found. Running without venv.' -ForegroundColor Yellow
}
if (Test-Path 'requirements.txt') {
  python -m pip show uvicorn | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Installing requirements...' -ForegroundColor Cyan
    python -m pip install -r requirements.txt
  }
}
python -m uvicorn app.main:app --reload
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WorkingDirectory (Get-Location)

Write-Host "Opening frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path (Get-Location) "frontend\index.html"
Start-Process $frontendPath

Write-Host "Demo running. Backend at http://localhost:8000" -ForegroundColor Green

$websiteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $websiteRoot "huizenmarkt-website-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$exclude = @("node_modules", "huizenmarkt-website-deploy.zip", ".env", ".netlify")
$items = Get-ChildItem -Path $websiteRoot -Force | Where-Object { $exclude -notcontains $_.Name }
Compress-Archive -Path ($items | ForEach-Object { $_.FullName }) -DestinationPath $zipPath -Force
Write-Host "Deploy ZIP: $zipPath"
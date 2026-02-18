Set-Location "E:\Programing\E-commerce"
$env:GIT_EDITOR = "true"
git fetch origin
git merge origin/main -m "Merge remote changes"
git push origin main
Write-Host "Push completed!" -ForegroundColor Green

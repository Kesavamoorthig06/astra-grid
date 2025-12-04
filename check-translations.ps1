# ASTRA GRID Translation Update Script
# This script helps identify files that need useTranslation() added

Write-Host "=== ASTRA GRID Translation Analysis ===" -ForegroundColor Cyan

$frontendPath = "C:\Users\viper\OneDrive\Desktop\ASTRA_GRID\frontend"
$pagesPath = Join-Path $frontendPath "pages"
$componentsPath = Join-Path $frontendPath "components"

# Files that need translation
$filesToUpdate = @(
    (Join-Path $pagesPath "Login.jsx"),
    (Join-Path $pagesPath "Signup.jsx"),
    (Join-Path $pagesPath "SimulationPage.jsx"),
    (Join-Path $pagesPath "TransmissionLineForm.jsx"),
    (Join-Path $pagesPath "History.jsx"),
    (Join-Path $pagesPath "AccountSettings.jsx"),
    (Join-Path $pagesPath "Magic.jsx")
)

Write-Host "`nChecking which files already have useTranslation..." -ForegroundColor Yellow

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $hasTranslation = $content -match "useTranslation"
        $fileName = Split-Path $file -Leaf
        
        if ($hasTranslation) {
            Write-Host "  ✓ $fileName - Already has useTranslation" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $fileName - NEEDS useTranslation added" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "These files need translation support added:" -ForegroundColor Yellow
Write-Host "1. Add: import { useTranslation } from 'react-i18next';" -ForegroundColor White
Write-Host "2. Add: const { t } = useTranslation(); inside component" -ForegroundColor White
Write-Host "3. Replace all hardcoded text with t('key.name')" -ForegroundColor White

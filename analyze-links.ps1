# Script to count external links in all component HTML files

$pagesPath = "src\app\pages"
$htmlFiles = Get-ChildItem -Path $pagesPath -Recurse -Filter *.component.html

$results = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Find all href links with http/https (external links)
    $externalLinks = [regex]::Matches($content, 'href="(https?://[^"]+)"')
    
    $externalCount = $externalLinks.Count
    
    # Create relative path for display
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    
    # Determine status
    $status = ""
    if ($externalCount -lt 8) {
        $status = "TOO FEW"
    } elseif ($externalCount -ge 8 -and $externalCount -le 10) {
        $status = "PERFECT"
    } elseif ($externalCount -eq 11 -or $externalCount -eq 12) {
        $status = "OK"
    } else {
        $status = "TOO MANY"
    }
    
    $results += [PSCustomObject]@{
        File = $relativePath
        ExternalLinks = $externalCount
        Status = $status
    }
}

# Sort by external link count (descending) then by filename
$results = $results | Sort-Object -Property @{Expression="ExternalLinks"; Descending=$true}, @{Expression="File"}

# Display results
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "EXTERNAL LINKS ANALYSIS" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Target: 8-10 links (ideal)" -ForegroundColor Green
Write-Host "Acceptable: 11-12 links" -ForegroundColor Yellow
Write-Host "Issue: Less than 8 or More than 12 links`n" -ForegroundColor Red

# Group by status
$tooMany = $results | Where-Object { $_.ExternalLinks -gt 12 }
$tooFew = $results | Where-Object { $_.ExternalLinks -lt 8 }
$ok = $results | Where-Object { $_.ExternalLinks -ge 11 -and $_.ExternalLinks -le 12 }
$perfect = $results | Where-Object { $_.ExternalLinks -ge 8 -and $_.ExternalLinks -le 10 }

# Display summary
Write-Host "SUMMARY:" -ForegroundColor Cyan
Write-Host "  Perfect (8-10): $($perfect.Count)" -ForegroundColor Green
Write-Host "  OK (11-12): $($ok.Count)" -ForegroundColor Yellow
Write-Host "  Too Few (<8): $($tooFew.Count)" -ForegroundColor Red
Write-Host "  Too Many (>12): $($tooMany.Count)" -ForegroundColor Red
Write-Host ""

# Display issues first
if ($tooMany.Count -gt 0) {
    Write-Host "`nPAGES WITH TOO MANY EXTERNAL LINKS (More than 12):" -ForegroundColor Red
    $tooMany | Format-Table -Property File, ExternalLinks, Status -AutoSize
}

if ($tooFew.Count -gt 0) {
    Write-Host "`nPAGES WITH TOO FEW EXTERNAL LINKS (Less than 8):" -ForegroundColor Yellow
    $tooFew | Format-Table -Property File, ExternalLinks, Status -AutoSize
}

if ($ok.Count -gt 0) {
    Write-Host "`nPAGES WITH OK EXTERNAL LINKS (11-12):" -ForegroundColor Yellow
    $ok | Format-Table -Property File, ExternalLinks, Status -AutoSize
}

if ($perfect.Count -gt 0) {
    Write-Host "`nPAGES WITH PERFECT EXTERNAL LINKS (8-10):" -ForegroundColor Green
    $perfect | Format-Table -Property File, ExternalLinks, Status -AutoSize
}

# Export to CSV for detailed analysis
$csvPath = "external-links-report.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "`nDetailed report exported to: $csvPath" -ForegroundColor Cyan

# Show pages that need attention
$needsAttention = $results | Where-Object { $_.ExternalLinks -lt 8 -or $_.ExternalLinks -gt 12 }
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "PAGES NEEDING ATTENTION: $($needsAttention.Count)" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

if ($needsAttention.Count -eq 0) {
    Write-Host "All pages are within acceptable range!" -ForegroundColor Green
}


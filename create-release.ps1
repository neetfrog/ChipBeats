#!/usr/bin/env pwsh
# GitHub Release Creator for ChipBeats
# This script creates a GitHub release and uploads the built executables

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$Owner = "neetfrog",
    [string]$Repo = "ChipBeats",
    [string]$TagName = "v1.0.0",
    [string]$ReleaseName = "ChipBeats v1.0.0",
    [string]$Description = "Windows desktop application for ChipBeats - Chiptune Drum Machine`n`nDownload options:`n- **ChipBeats Setup 1.0.0.exe** - NSIS Installer (recommended)`n- **ChipBeats-1.0.0-portable.exe** - Portable version (no installation)`n- **ChipBeats-1.0.0-win.zip** - ZIP archive"
)

$BaseUrl = "https://api.github.com/repos/$Owner/$Repo"
$Headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

# Step 1: Create Release
Write-Host "Creating release: $ReleaseName..." -ForegroundColor Cyan

$ReleaseBody = @{
    tag_name = $TagName
    name = $ReleaseName
    body = $Description
    draft = $false
    prerelease = $false
} | ConvertTo-Json

try {
    $ReleaseResponse = Invoke-WebRequest -Uri "$BaseUrl/releases" `
        -Method POST `
        -Headers $Headers `
        -ContentType "application/json" `
        -Body $ReleaseBody `
        -ErrorAction Stop
    
    $Release = $ReleaseResponse.Content | ConvertFrom-Json
    $UploadUrl = $Release.upload_url -replace '\{\?name,label\}', ''
    Write-Host "✓ Release created: $($Release.html_url)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create release: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Upload Assets
$Assets = @(
    @{ Path = "dist/ChipBeats Setup 1.0.0.exe"; Label = "NSIS Installer" },
    @{ Path = "dist/ChipBeats-1.0.0-portable.exe"; Label = "Portable Executable" },
    @{ Path = "dist/ChipBeats-1.0.0-win.zip"; Label = "ZIP Archive" }
)

foreach ($Asset in $Assets) {
    if (Test-Path $Asset.Path) {
        Write-Host "Uploading $($Asset.Path)..." -ForegroundColor Cyan
        
        $FileName = Split-Path -Leaf $Asset.Path
        $FileBytes = [IO.File]::ReadAllBytes($Asset.Path)
        
        try {
            Invoke-WebRequest -Uri "$UploadUrl?name=$FileName" `
                -Method POST `
                -Headers $Headers `
                -ContentType "application/octet-stream" `
                -Body $FileBytes `
                -ErrorAction Stop | Out-Null
            
            Write-Host "✓ Uploaded: $FileName" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Failed to upload $FileName : $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "✗ File not found: $($Asset.Path)" -ForegroundColor Red
    }
}

Write-Host "`n✓ Release complete! View it at: $($Release.html_url)" -ForegroundColor Green

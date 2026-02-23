# VibeCoding Professionals Platform - Database Initialization Script
# Creates a fresh SQLite database with schema and reference data
#
# Usage: .\init_db.ps1 [-DatabaseName <name>]
#   -DatabaseName: Optional. Defaults to "event.db"

param(
    [string]$DatabaseName = "event.db"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbPath = Join-Path $ScriptDir $DatabaseName
$SqliteToolsDir = Join-Path $ScriptDir ".sqlite-tools"
$SqliteExe = Join-Path $SqliteToolsDir "sqlite3.exe"

function Download-SqliteTools {
    Write-Host "SQLite not found. Downloading SQLite tools..."

    $SqliteUrl = "https://www.sqlite.org/2024/sqlite-tools-win-x64-3450100.zip"
    $ZipPath = Join-Path $env:TEMP "sqlite-tools.zip"

    # Create tools directory
    if (-not (Test-Path $SqliteToolsDir)) {
        New-Item -ItemType Directory -Path $SqliteToolsDir | Out-Null
    }

    # Download
    Write-Host "Downloading from $SqliteUrl ..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $SqliteUrl -OutFile $ZipPath

    # Extract
    Write-Host "Extracting..."
    Expand-Archive -Path $ZipPath -DestinationPath $SqliteToolsDir -Force

    # Move files from nested folder if exists
    $NestedDir = Get-ChildItem -Path $SqliteToolsDir -Directory | Select-Object -First 1
    if ($NestedDir) {
        Get-ChildItem -Path $NestedDir.FullName -File | Move-Item -Destination $SqliteToolsDir -Force
        Remove-Item -Path $NestedDir.FullName -Recurse -Force
    }

    # Cleanup
    Remove-Item -Path $ZipPath -Force

    Write-Host "SQLite tools installed to $SqliteToolsDir"
}

function Get-SqliteExe {
    # Check if sqlite3 is in PATH
    $InPath = Get-Command "sqlite3" -ErrorAction SilentlyContinue
    if ($InPath) {
        return "sqlite3"
    }

    # Check local tools directory
    if (Test-Path $SqliteExe) {
        return $SqliteExe
    }

    # Download if not found
    Download-SqliteTools

    if (Test-Path $SqliteExe) {
        return $SqliteExe
    }

    throw "Failed to locate or download SQLite"
}

function Run-SqlFile {
    param(
        [string]$SqlitePath,
        [string]$DbPath,
        [string]$SqlFile
    )

    $SqlFilePath = Join-Path $ScriptDir $SqlFile
    if (-not (Test-Path $SqlFilePath)) {
        throw "SQL file not found: $SqlFilePath"
    }

    $Content = Get-Content -Path $SqlFilePath -Raw
    $Process = Start-Process -FilePath $SqlitePath -ArgumentList "`"$DbPath`"" -NoNewWindow -Wait -PassThru -RedirectStandardInput $SqlFilePath -RedirectStandardError (Join-Path $env:TEMP "sqlite_err.txt")

    if ($Process.ExitCode -ne 0) {
        $ErrContent = Get-Content -Path (Join-Path $env:TEMP "sqlite_err.txt") -Raw -ErrorAction SilentlyContinue
        throw "Failed to execute $SqlFile : $ErrContent"
    }
}

# Main
Write-Host "Initializing database: $DatabaseName"
Write-Host ""

# Get SQLite executable
$Sqlite = Get-SqliteExe
Write-Host "Using SQLite: $Sqlite"

# Remove existing database
if (Test-Path $DbPath) {
    Write-Host "Removing existing database..."
    Remove-Item -Path $DbPath -Force
}

# Create schema
Write-Host "Creating schema..."
& $Sqlite $DbPath ".read `"$(Join-Path $ScriptDir 'schema.sql')`""
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create schema"
}

# Load reference data
Write-Host "Loading reference data..."
& $Sqlite $DbPath ".read `"$(Join-Path $ScriptDir 'seed_reference_data.sql')`""
if ($LASTEXITCODE -ne 0) {
    throw "Failed to load reference data"
}

Write-Host ""
Write-Host "Database initialized successfully: $DbPath" -ForegroundColor Green
Write-Host ""
Write-Host "Verification:"

$Counts = @(
    @("Decision types", "SELECT COUNT(*) FROM decision_type_catalog;"),
    @("Readiness states", "SELECT COUNT(*) FROM readiness_state_catalog;"),
    @("Action states", "SELECT COUNT(*) FROM action_state_catalog;"),
    @("User roles", "SELECT COUNT(*) FROM user_role_catalog;"),
    @("Items", "SELECT COUNT(*) FROM items;"),
    @("Inventories", "SELECT COUNT(*) FROM inventories;")
)

foreach ($Item in $Counts) {
    $Result = & $Sqlite $DbPath $Item[1]
    Write-Host "  $($Item[0]): $Result"
}

# iknowaguy Install Script for Windows (PowerShell)
# Usage: iwr -useb https://install.iknowaguy.ai/install.ps1 | iex

#Requires -Version 5.1

$ErrorActionPreference = "Stop"

# ── Colors ───────────────────────────────────────────────────────────────────
function Write-Color($Text, $Color = "White", $NoNewline = $false) {
    $params = @{ Object = $Text; NoNewline = $NoNewline }
    if ($Color) { $params.ForegroundColor = $Color }
    Write-Host @params
}

function Info($msg)    { Write-Color "ℹ  $msg" "Cyan" }
function Success($msg) { Write-Color "✔  $msg" "Green" }
function Warn($msg)    { Write-Color "⚠  $msg" "Yellow" }
function Error($msg)   { Write-Color "✖  $msg" "Red" }
function Step($msg)    { Write-Host ""; Write-Color "▶ $msg" "Magenta" }

# ── Config ───────────────────────────────────────────────────────────────────
$RepoUrl = "https://github.com/jayamitkatariya/iknowaguy.git"
$InstallDir = Join-Path $env:USERPROFILE ".iknowaguy"
$MinNodeVersion = 18

# ── Banner ───────────────────────────────────────────────────────────────────
function Print-Banner {
    Write-Host ""
    Write-Color @"

  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   ██╗  ██╗██╗██████╗ ███████╗ █████╗ ██╗   ██╗███╗   ███╗    ║
  ║   ██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║   ██║████╗ ████║    ║
  ║   ███████║██║██████╔╝█████╗  ███████║██║   ██║██╔████╔██║    ║
  ║   ██╔══██║██║██╔══██╗██╔══╝  ██╔══██║██║   ██║██║╚██╔╝██║    ║
  ║   ██║  ██║██║██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║    ║
  ║   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝    ║
  ║                                                               ║
  ║        Open-source framework for AI agents to bring           ║
  ║              humans into the loop                             ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝

"@ "Cyan"
}

# ── Node.js Check ────────────────────────────────────────────────────────────
function Check-Node {
    Step "Checking prerequisites"

    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Error "Node.js is not installed."
        Write-Host ""
        Write-Host "   Please install Node.js $MinNodeVersion or later:"
        Write-Color "   https://nodejs.org/" "Cyan"
        Write-Host ""
        exit 1
    }

    $nodeVersion = node -v
    $nodeMajor = [int]($nodeVersion -replace '^v' -split '\.' | Select-Object -First 1)

    if ($nodeMajor -lt $MinNodeVersion) {
        Error "Node.js $nodeVersion is too old."
        Write-Host ""
        Write-Host "   iknowaguy requires Node.js >= $MinNodeVersion."
        Write-Color "   https://nodejs.org/" "Cyan"
        Write-Host ""
        exit 1
    }

    Success "Node.js $nodeVersion"

    $npmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if (-not $npmCmd) {
        Error "npm is not installed."
        Write-Host ""
        Write-Host "   npm usually comes with Node.js. Please reinstall Node.js."
        Write-Host ""
        exit 1
    }

    $npmVersion = npm -v
    Success "npm v$npmVersion"
}

# ── Clone or Update ──────────────────────────────────────────────────────────
function Clone-OrPull {
    Step "Installing iknowaguy to $InstallDir"

    if (Test-Path (Join-Path $InstallDir ".git")) {
        Info "Existing installation found. Updating..."
        Push-Location $InstallDir
        git pull --ff-only
        Pop-Location
    } else {
        Info "Cloning repository..."
        if (Test-Path $InstallDir) {
            Warn "Directory exists but is not a git repo. Backing up..."
            $backup = "${InstallDir}.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
            Rename-Item $InstallDir $backup
        }
        git clone --depth 1 $RepoUrl $InstallDir
    }

    Success "Repository ready at $InstallDir"
}

# ── Install & Build ──────────────────────────────────────────────────────────
function Install-Deps {
    Step "Installing dependencies"
    Push-Location $InstallDir
    npm install
    Pop-Location
    Success "Dependencies installed"
}

function Build-Project {
    Step "Building project"
    Push-Location $InstallDir
    npm run build
    Pop-Location
    Success "Build complete"
}

# ── PATH Setup ───────────────────────────────────────────────────────────────
function Setup-Path {
    Step "Setting up PATH"

    $binPath = Join-Path $InstallDir "packages\cli\bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($currentPath -like "*$binPath*") {
        Success "$binPath is already in your PATH"
        return
    }

    Write-Host ""
    Write-Host "   To use the iknowaguy command, add this directory to your PATH:"
    Write-Color "   $binPath" "Cyan"
    Write-Host ""

    $response = Read-Host "   Would you like to add this to your user PATH? (y/N)"
    if ($response -match '^[Yy]$') {
        $newPath = "$currentPath;$binPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Success "Added to user PATH"
        Warn "Open a new PowerShell window to use iknowaguy"
    } else {
        Info "Skipping PATH modification. Add the directory above to your PATH manually."
    }
}

# ── Success ──────────────────────────────────────────────────────────────────
function Print-Success {
    Write-Host ""
    Write-Color @"
  ╔═══════════════════════════════════════════════════════════════╗
  ║                     INSTALL COMPLETE!                         ║
  ╚═══════════════════════════════════════════════════════════════╝
"@ "Green"
    Write-Host ""
    Write-Host "  Next Steps:"
    Write-Host ""
    Write-Host "  1. Initialize your project:"
    Write-Color "     iknowaguy init" "Cyan"
    Write-Host ""
    Write-Host "  2. Start all servers:"
    Write-Color "     iknowaguy dev" "Cyan"
    Write-Host ""
    Write-Host "  3. Run the setup wizard:"
    Write-Color "     iknowaguy setup:agent" "Cyan"
    Write-Host ""
    Write-Color "  Docs:    https://docs.iknowaguy.ai" "Gray"
    Write-Color "  GitHub:  https://github.com/jayamitkatariya/iknowaguy" "Gray"
    Write-Host ""
}

# ── Main ─────────────────────────────────────────────────────────────────────
function Main {
    Print-Banner
    Check-Node
    Clone-OrPull
    Install-Deps
    Build-Project
    Setup-Path
    Print-Success
}

Main

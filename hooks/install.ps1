# prove-it installer for Windows (PowerShell)
#
# Usage:
#   .\hooks\install.ps1
#   .\hooks\install.ps1 -Force

param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$RepoDir = Split-Path -Parent $PSScriptRoot
$HooksDir = Join-Path $env:USERPROFILE '.claude\hooks'
$SettingsFile = Join-Path $env:USERPROFILE '.claude\settings.json'
$BackupFile = Join-Path $env:USERPROFILE '.claude\settings.json.prove-it-backup'

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required but not found. Install from https://nodejs.org"
  exit 1
}

# Already installed check
if (-not $Force -and (Test-Path (Join-Path $HooksDir 'prove-it-activate.js'))) {
  Write-Host "prove-it is already installed. Run with -Force to reinstall."
  exit 0
}

# Create hooks directory
New-Item -ItemType Directory -Force -Path $HooksDir | Out-Null

# Copy hook files
Write-Host "Installing prove-it hooks..."
$files = @('prove-it-activate.js', 'prove-it-config.js', 'prove-it-mode-tracker.js', 'prove-it-statusline.sh')
foreach ($f in $files) {
  Copy-Item (Join-Path $RepoDir "hooks\$f") (Join-Path $HooksDir $f) -Force
}

# Backup settings.json
if (Test-Path $SettingsFile) {
  Copy-Item $SettingsFile $BackupFile -Force
  Write-Host "Backed up settings.json -> settings.json.prove-it-backup"
}

# Merge settings using Node.js
$nodeScript = @"
const fs = require('fs');
const path = require('path');
const settingsFile = process.argv[2];
const hooksDir = process.argv[3];

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch {}

if (!settings.hooks) settings.hooks = {};

if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
const alreadySession = (settings.hooks.SessionStart || []).some(
  h => JSON.stringify(h).includes('prove-it-activate')
);
if (!alreadySession) {
  settings.hooks.SessionStart.push({
    hooks: [{ type: 'command', command: 'node "' + path.join(hooksDir, 'prove-it-activate.js') + '"' }]
  });
}

if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];
const alreadyPrompt = (settings.hooks.UserPromptSubmit || []).some(
  h => JSON.stringify(h).includes('prove-it-mode-tracker')
);
if (!alreadyPrompt) {
  settings.hooks.UserPromptSubmit.push({
    hooks: [{ type: 'command', command: 'node "' + path.join(hooksDir, 'prove-it-mode-tracker.js') + '"' }]
  });
}

if (!settings.statusLine) {
  settings.statusLine = {
    type: 'command',
    command: 'bash "' + path.join(hooksDir, 'prove-it-statusline.sh') + '"'
  };
}

fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
console.log('settings.json updated');
"@

node -e $nodeScript $SettingsFile $HooksDir

Write-Host ""
Write-Host "✓ prove-it installed"
Write-Host ""
Write-Host "  Hooks installed to: $HooksDir"
Write-Host "  Settings updated:   $SettingsFile"
Write-Host ""
Write-Host "  prove-it is now active in all Claude Code sessions."
Write-Host "  Start a new session to activate, or run: /prove-it"
Write-Host ""
Write-Host "  Modes:"
Write-Host "    verify (default)  -- plan before, output after"
Write-Host "    tdd               -- /prove-it tdd"
Write-Host "    strict            -- /prove-it strict"
Write-Host "    off               -- /prove-it off"

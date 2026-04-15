# prove-it installer for Windows (PowerShell)
#
# Usage — from a local clone:
#   .\hooks\install.ps1
#   .\hooks\install.ps1 -Force
#
# Usage — remote install (no clone required):
#   irm https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.ps1 | iex
#
# What this does:
#   1. Copies (or downloads) hook files to %USERPROFILE%\.claude\hooks\
#   2. Merges hook entries into %USERPROFILE%\.claude\settings.json using Node.js
#   3. Backs up settings.json before modification
#   4. Verifies the install succeeded

param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$HooksDir    = Join-Path $env:USERPROFILE '.claude\hooks'
$SettingsFile = Join-Path $env:USERPROFILE '.claude\settings.json'
$BackupFile  = Join-Path $env:USERPROFILE '.claude\settings.json.prove-it-backup'
$GithubRaw   = 'https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main'

$HookFiles = @(
  'prove-it-activate.js',
  'prove-it-config.js',
  'prove-it-mode-tracker.js',
  'prove-it-statusline.js'
)

# ─── Detect install mode: local clone vs remote (irm | iex) ──────────────────
# When piped through iex, $PSScriptRoot is empty — download from GitHub instead.
if ($PSScriptRoot) {
  $InstallMode = 'local'
  $RepoDir = Split-Path -Parent $PSScriptRoot
} else {
  $InstallMode = 'remote'
}

# ─── Checks ───────────────────────────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required but not found. Install from https://nodejs.org"
  exit 1
}

# ─── Already installed check ──────────────────────────────────────────────────
if (-not $Force -and (Test-Path (Join-Path $HooksDir 'prove-it-activate.js'))) {
  Write-Host "prove-it is already installed. Run with -Force to reinstall."
  exit 0
}

# ─── Create hooks directory ───────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path $HooksDir | Out-Null

# ─── Install hook files ───────────────────────────────────────────────────────
Write-Host "Installing prove-it hooks..."

foreach ($f in $HookFiles) {
  $dest = Join-Path $HooksDir $f
  if ($InstallMode -eq 'local') {
    Copy-Item (Join-Path $RepoDir "hooks\$f") $dest -Force
  } else {
    Invoke-WebRequest -Uri "$GithubRaw/hooks/$f" -OutFile $dest -UseBasicParsing
  }
}

# ─── Backup settings.json ─────────────────────────────────────────────────────
if (Test-Path $SettingsFile) {
  Copy-Item $SettingsFile $BackupFile -Force
  Write-Host "Backed up settings.json -> settings.json.prove-it-backup"
}

# ─── Merge settings using Node.js ─────────────────────────────────────────────
$nodeScript = @"
const fs = require('fs');
const path = require('path');
const settingsFile = process.argv[2];
const hooksDir = process.argv[3];

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch {}

if (!settings.hooks) settings.hooks = {};

// SessionStart hook
if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
const alreadySession = (settings.hooks.SessionStart || []).some(
  h => JSON.stringify(h).includes('prove-it-activate')
);
if (!alreadySession) {
  settings.hooks.SessionStart.push({
    hooks: [{ type: 'command', command: 'node "' + path.join(hooksDir, 'prove-it-activate.js') + '"' }]
  });
}

// UserPromptSubmit hook
if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];
const alreadyPrompt = (settings.hooks.UserPromptSubmit || []).some(
  h => JSON.stringify(h).includes('prove-it-mode-tracker')
);
if (!alreadyPrompt) {
  settings.hooks.UserPromptSubmit.push({
    hooks: [{ type: 'command', command: 'node "' + path.join(hooksDir, 'prove-it-mode-tracker.js') + '"' }]
  });
}

// Statusline (Node.js script — cross-platform)
if (!settings.statusLine) {
  settings.statusLine = {
    type: 'command',
    command: 'node "' + path.join(hooksDir, 'prove-it-statusline.js') + '"'
  };
}

fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
console.log('settings.json updated');
"@

node -e $nodeScript $SettingsFile $HooksDir

# ─── Post-install verification ────────────────────────────────────────────────
Write-Host ""
Write-Host "Verifying install..."

$VerifyOk = $true

foreach ($f in $HookFiles) {
  if (-not (Test-Path (Join-Path $HooksDir $f))) {
    Write-Host "  x Missing hook: $(Join-Path $HooksDir $f)"
    $VerifyOk = $false
  }
}

$verifyScript = @"
const fs = require('fs');
try {
  const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const ok =
    JSON.stringify(j.hooks && j.hooks.SessionStart).includes('prove-it-activate') &&
    JSON.stringify(j.hooks && j.hooks.UserPromptSubmit).includes('prove-it-mode-tracker') &&
    JSON.stringify(j.statusLine).includes('prove-it-statusline');
  process.exit(ok ? 0 : 1);
} catch { process.exit(1); }
"@

$verifyResult = node -e $verifyScript $SettingsFile 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  x settings.json hooks not registered correctly"
  $VerifyOk = $false
}

if (-not $VerifyOk) {
  Write-Host ""
  Write-Host "  Installation incomplete. Try running with -Force:"
  Write-Host "  irm https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.ps1 | iex"
  exit 1
}

# ─── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "v prove-it installed"
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
Write-Host ""

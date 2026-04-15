#!/usr/bin/env bash
# prove-it installer for macOS and Linux
#
# Usage — from a local clone:
#   bash hooks/install.sh
#   bash hooks/install.sh --force        # reinstall / overwrite existing
#
# Usage — direct curl install (no local clone needed):
#   bash <(curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.sh)
#
# What this does:
#   1. Copies (or downloads) hook files to ~/.claude/hooks/
#   2. Merges hook entries into ~/.claude/settings.json using Node.js
#   3. Backs up settings.json before modification
#   4. Verifies the install succeeded

set -euo pipefail

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/settings.json.prove-it-backup"
FORCE=false

GITHUB_RAW="https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main"

HOOK_FILES=(
  "prove-it-activate.js"
  "prove-it-config.js"
  "prove-it-mode-tracker.js"
  "prove-it-statusline.js"
)

# ─── Parse args ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ─── Detect install mode: local clone vs curl pipe ────────────────────────────
# When run via `bash <(curl ...)`, BASH_SOURCE[0] resolves to a /dev/fd/ path.
# In that case download hook files from GitHub instead of copying them locally.
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
if [[ -z "$SCRIPT_PATH" || "$SCRIPT_PATH" == /dev/fd/* || "$SCRIPT_PATH" == /proc/* ]]; then
  INSTALL_MODE="curl"
else
  REPO_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
  INSTALL_MODE="local"
fi

# ─── Checks ───────────────────────────────────────────────────────────────────
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  echo "Windows detected. Use the PowerShell installer instead:"
  echo ""
  echo "  irm https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.ps1 | iex"
  echo ""
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required but not found. Install from https://nodejs.org"
  exit 1
fi

if [[ "$INSTALL_MODE" == "curl" ]] && ! command -v curl &>/dev/null; then
  echo "Error: curl is required for remote installation but was not found."
  exit 1
fi

# ─── Already installed check ──────────────────────────────────────────────────
if [[ "$FORCE" == false ]] && [[ -f "$HOOKS_DIR/prove-it-activate.js" ]]; then
  echo "prove-it is already installed. Run with --force to reinstall."
  exit 0
fi

# ─── Create hooks directory ───────────────────────────────────────────────────
mkdir -p "$HOOKS_DIR"

# ─── Install hook files ───────────────────────────────────────────────────────
echo "Installing prove-it hooks..."

for hook_file in "${HOOK_FILES[@]}"; do
  if [[ "$INSTALL_MODE" == "local" ]]; then
    cp "$REPO_DIR/hooks/$hook_file" "$HOOKS_DIR/$hook_file"
  else
    curl -fsSL "$GITHUB_RAW/hooks/$hook_file" -o "$HOOKS_DIR/$hook_file"
  fi
done

# ─── Backup settings.json ────────────────────────────────────────────────────
if [[ -f "$SETTINGS_FILE" ]]; then
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  echo "Backed up settings.json → settings.json.prove-it-backup"
fi

# ─── Merge into settings.json using Node.js ──────────────────────────────────
# Node.js handles special characters in home directory paths safely
node - "$SETTINGS_FILE" "$HOOKS_DIR" <<'EOF'
const fs = require('fs');
const path = require('path');

const settingsFile = process.argv[2];
const hooksDir = process.argv[3];

// Read existing settings or start fresh
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
} catch {
  // File doesn't exist or invalid JSON — start fresh
}

// Ensure hooks structure exists
if (!settings.hooks) settings.hooks = {};

// SessionStart hook
if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
const sessionStartHook = {
  hooks: [{
    type: 'command',
    command: `node "${path.join(hooksDir, 'prove-it-activate.js')}"`
  }]
};
const alreadyHasSessionStart = (settings.hooks.SessionStart || []).some(
  (h) => JSON.stringify(h).includes('prove-it-activate')
);
if (!alreadyHasSessionStart) {
  settings.hooks.SessionStart.push(sessionStartHook);
}

// UserPromptSubmit hook
if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];
const promptHook = {
  hooks: [{
    type: 'command',
    command: `node "${path.join(hooksDir, 'prove-it-mode-tracker.js')}"`
  }]
};
const alreadyHasPromptHook = (settings.hooks.UserPromptSubmit || []).some(
  (h) => JSON.stringify(h).includes('prove-it-mode-tracker')
);
if (!alreadyHasPromptHook) {
  settings.hooks.UserPromptSubmit.push(promptHook);
}

// Statusline (Node.js script — cross-platform)
if (!settings.statusLine) {
  settings.statusLine = {
    type: 'command',
    command: `node "${path.join(hooksDir, 'prove-it-statusline.js')}"`
  };
}

// Write back
fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
console.log('settings.json updated');
EOF

# ─── Detect project language for post-install message ────────────────────────
DETECTED_LANG=$(node -e "
const fs = require('fs'), path = require('path');
function findUp(filename, dir) {
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, filename))) return true;
    dir = path.dirname(dir);
  }
  return false;
}
const cwd = process.cwd();
if (findUp('package.json', cwd)) { process.stdout.write('Node.js/TypeScript'); }
else if (findUp('go.mod', cwd)) { process.stdout.write('Go'); }
else if (findUp('Cargo.toml', cwd)) { process.stdout.write('Rust'); }
else if (findUp('pyproject.toml', cwd) || findUp('setup.py', cwd)) { process.stdout.write('Python'); }
else if (findUp('pom.xml', cwd)) { process.stdout.write('Java (Maven)'); }
else if (findUp('build.gradle', cwd)) { process.stdout.write('Java (Gradle)'); }
" 2>/dev/null || true)

# ─── Post-install verification ────────────────────────────────────────────────
echo ""
echo "Verifying install..."

VERIFY_OK=true

for hook_file in "${HOOK_FILES[@]}"; do
  if [[ ! -f "$HOOKS_DIR/$hook_file" ]]; then
    echo "  ✗ Missing hook: $HOOKS_DIR/$hook_file"
    VERIFY_OK=false
  fi
done

if ! node -e "
  const s = require('fs').readFileSync('$SETTINGS_FILE', 'utf8');
  const j = JSON.parse(s);
  const ok =
    JSON.stringify(j.hooks && j.hooks.SessionStart).includes('prove-it-activate') &&
    JSON.stringify(j.hooks && j.hooks.UserPromptSubmit).includes('prove-it-mode-tracker') &&
    JSON.stringify(j.statusLine).includes('prove-it-statusline');
  process.exit(ok ? 0 : 1);
" 2>/dev/null; then
  echo "  ✗ settings.json hooks not registered correctly"
  VERIFY_OK=false
fi

if [[ "$VERIFY_OK" == false ]]; then
  echo ""
  echo "  Installation incomplete. Try running with --force:"
  echo "  bash hooks/install.sh --force"
  exit 1
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "✓ prove-it installed"
echo ""
echo "  Hooks installed to: $HOOKS_DIR"
echo "  Settings updated:   $SETTINGS_FILE"
if [[ -n "$DETECTED_LANG" ]]; then
  echo "  Project detected:   $DETECTED_LANG"
fi
echo ""
echo "  prove-it is now active in all Claude Code sessions."
echo "  Start a new session to activate, or run: /prove-it"
echo ""
echo "  Modes:"
echo "    verify (default)  — plan before, output after"
echo "    tdd               — /prove-it tdd"
echo "    strict            — /prove-it strict"
echo "    off               — /prove-it off"
echo ""

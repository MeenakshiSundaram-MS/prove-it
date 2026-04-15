#!/usr/bin/env bash
# prove-it installer for macOS and Linux
#
# Usage:
#   bash hooks/install.sh
#   bash hooks/install.sh --force        # reinstall / overwrite existing
#
# What this does:
#   1. Copies hook files to ~/.claude/hooks/
#   2. Merges hook entries into ~/.claude/settings.json using Node.js
#   3. Backs up settings.json before modification

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/settings.json.prove-it-backup"
FORCE=false

# ─── Parse args ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ─── Checks ───────────────────────────────────────────────────────────────────
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  echo "Windows detected. Use hooks/install.ps1 instead."
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required but not found. Install from https://nodejs.org"
  exit 1
fi

# ─── Already installed check ──────────────────────────────────────────────────
if [[ "$FORCE" == false ]] && [[ -f "$HOOKS_DIR/prove-it-activate.js" ]]; then
  echo "prove-it is already installed. Run with --force to reinstall."
  exit 0
fi

# ─── Create hooks directory ───────────────────────────────────────────────────
mkdir -p "$HOOKS_DIR"

# ─── Copy hook files ──────────────────────────────────────────────────────────
echo "Installing prove-it hooks..."
cp "$REPO_DIR/hooks/prove-it-activate.js"    "$HOOKS_DIR/prove-it-activate.js"
cp "$REPO_DIR/hooks/prove-it-config.js"      "$HOOKS_DIR/prove-it-config.js"
cp "$REPO_DIR/hooks/prove-it-mode-tracker.js" "$HOOKS_DIR/prove-it-mode-tracker.js"
cp "$REPO_DIR/hooks/prove-it-statusline.sh"  "$HOOKS_DIR/prove-it-statusline.sh"
chmod +x "$HOOKS_DIR/prove-it-statusline.sh"

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
// Add only if not already present
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

// Statusline
if (!settings.statusLine) {
  settings.statusLine = {
    type: 'command',
    command: `bash "${path.join(hooksDir, 'prove-it-statusline.sh')}"`
  };
}

// Write back
fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf8');
console.log('settings.json updated');
EOF

# ─── Detect project for post-install message ──────────────────────────────────
PROJECT_INFO=$(node -e "
const { detectProject } = (() => {
  // Inline minimal detection for the install message
  const fs = require('fs'), path = require('path');
  function up(f, d) {
    let dir = d; const root = path.parse(dir).root;
    while (dir !== root) {
      if (fs.existsSync(path.join(dir, f))) return path.join(dir, f);
      dir = path.dirname(dir);
    }
    return null;
  }
  const cwd = process.cwd();
  if (up('package.json', cwd)) return { lang: 'Node.js/TypeScript' };
  if (up('go.mod', cwd)) return { lang: 'Go' };
  if (up('Cargo.toml', cwd)) return { lang: 'Rust' };
  if (up('pyproject.toml', cwd) || up('setup.py', cwd)) return { lang: 'Python' };
  if (up('pom.xml', cwd)) return { lang: 'Java (Maven)' };
  if (up('build.gradle', cwd)) return { lang: 'Java (Gradle)' };
  return { lang: null };
})();
" 2>/dev/null || echo "")

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "✓ prove-it installed"
echo ""
echo "  Hooks installed to: $HOOKS_DIR"
echo "  Settings updated:   $SETTINGS_FILE"
if [[ -n "$PROJECT_INFO" ]]; then
  echo "  Project detected:   $PROJECT_INFO"
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

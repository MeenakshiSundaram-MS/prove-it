#!/usr/bin/env bash
# prove-it uninstaller for macOS and Linux

set -euo pipefail

HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "Removing prove-it..."

# Remove hook files
for f in prove-it-activate.js prove-it-config.js prove-it-mode-tracker.js prove-it-statusline.sh; do
  rm -f "$HOOKS_DIR/$f" && echo "  Removed $HOOKS_DIR/$f"
done

# Remove flag files
rm -f "$HOME/.claude/.prove-it-active"
rm -f "$HOME/.claude/.prove-it-last-result"
rm -f "$HOME/.claude/.prove-it-prev-mode"

# Remove from settings.json
if [[ -f "$SETTINGS_FILE" ]]; then
  node - "$SETTINGS_FILE" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
let settings;
try { settings = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { process.exit(0); }

// Remove prove-it hooks
if (settings.hooks) {
  for (const event of ['SessionStart', 'UserPromptSubmit']) {
    if (Array.isArray(settings.hooks[event])) {
      settings.hooks[event] = settings.hooks[event].filter(
        (h) => !JSON.stringify(h).includes('prove-it')
      );
    }
  }
}

// Remove statusline if it's ours
if (settings.statusLine && JSON.stringify(settings.statusLine).includes('prove-it')) {
  delete settings.statusLine;
}

fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n', 'utf8');
console.log('  Removed prove-it entries from settings.json');
EOF
fi

echo ""
echo "✓ prove-it uninstalled."

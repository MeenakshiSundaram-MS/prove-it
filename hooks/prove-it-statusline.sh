#!/usr/bin/env bash
# prove-it — statusline badge for Claude Code
#
# Displays a blue [PROVE-IT] badge with the current mode and last result.
# Color: blue (ANSI 33 = 5;33 256-color), distinct from caveman's orange.
# Last result indicator: ✓ (green) or ✗ (red)

FLAG="$HOME/.claude/.prove-it-active"
RESULT="$HOME/.claude/.prove-it-last-result"

# If no flag file, prove-it is not installed — show nothing
[ ! -f "$FLAG" ] && exit 0

MODE=$(cat "$FLAG" 2>/dev/null | tr -d '[:space:]')

# Off mode — dim grey
if [ "$MODE" = "off" ]; then
  printf '\033[90m[PROVE-IT:OFF]\033[0m'
  exit 0
fi

# Build result indicator
INDICATOR=""
if [ -f "$RESULT" ]; then
  STATUS=$(cat "$RESULT" 2>/dev/null | tr -d '[:space:]')
  if [ "$STATUS" = "PASS" ]; then
    INDICATOR='\033[32m✓\033[0m'   # green check
  elif [ "$STATUS" = "FAIL" ]; then
    INDICATOR='\033[31m✗\033[0m'   # red x
  fi
fi

# Build mode suffix
if [ "$MODE" = "verify" ] || [ -z "$MODE" ]; then
  LABEL="PROVE-IT"
else
  LABEL="PROVE-IT:$(echo "$MODE" | tr '[:lower:]' '[:upper:]')"
fi

# Print badge: blue label + result indicator
printf "\033[38;5;33m[%s]\033[0m" "$LABEL"
[ -n "$INDICATOR" ] && printf "%b" "$INDICATOR"

exit 0

#!/usr/bin/env bash
# prove-it — statusline badge for Claude Code
#
# Displays a blue [PROVE-IT] badge with the current mode.
# Color: blue (ANSI 33 = 5;33 256-color), distinct from caveman's orange.

FLAG="$HOME/.claude/.prove-it-active"

# If no flag file, prove-it is not installed — show nothing
[ ! -f "$FLAG" ] && exit 0

MODE=$(cat "$FLAG" 2>/dev/null | tr -d '[:space:]')

# Off mode — dim grey
if [ "$MODE" = "off" ]; then
  printf '\033[90m[PROVE-IT:OFF]\033[0m'
  exit 0
fi

# Build mode suffix
if [ "$MODE" = "verify" ] || [ -z "$MODE" ]; then
  LABEL="PROVE-IT"
else
  LABEL="PROVE-IT:$(echo "$MODE" | tr '[:lower:]' '[:upper:]')"
fi

# Print badge in blue
printf "\033[38;5;33m[%s]\033[0m" "$LABEL"

exit 0

#!/usr/bin/env node
/**
 * prove-it-statusline.js — Claude Code statusline badge (cross-platform)
 *
 * Replaces prove-it-statusline.sh so the statusline works on Windows,
 * macOS, and Linux without requiring bash in PATH.
 *
 * Displays a blue [PROVE-IT] badge with the current mode.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const FLAG = path.join(os.homedir(), '.claude', '.prove-it-active');

// No flag file means prove-it is not installed — show nothing
if (!fs.existsSync(FLAG)) process.exit(0);

let mode = '';
try {
  mode = fs.readFileSync(FLAG, 'utf8').trim();
} catch {
  process.exit(0);
}

// Off mode — dim grey
if (mode === 'off') {
  process.stdout.write('\x1b[90m[PROVE-IT:OFF]\x1b[0m');
  process.exit(0);
}

const label = (mode === 'verify' || !mode) ? 'PROVE-IT' : `PROVE-IT:${mode.toUpperCase()}`;

// Blue badge (256-color ANSI, matches the original bash script)
process.stdout.write(`\x1b[38;5;33m[${label}]\x1b[0m`);
process.exit(0);

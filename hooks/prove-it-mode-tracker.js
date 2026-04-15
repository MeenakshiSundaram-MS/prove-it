#!/usr/bin/env node
/**
 * prove-it-mode-tracker.js — Claude Code UserPromptSubmit hook
 *
 * Reads stdin for the user's prompt. Detects /prove-it commands and updates
 * the mode flag file accordingly.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { VALID_MODES, getDefaultMode } = require('./prove-it-config');

const FLAG_FILE = path.join(os.homedir(), '.claude', '.prove-it-active');
const LAST_RESULT_FILE = path.join(os.homedir(), '.claude', '.prove-it-last-result');
const PREV_MODE_FILE = path.join(os.homedir(), '.claude', '.prove-it-prev-mode');

function readFileSafe(filePath) {
  try { return fs.readFileSync(filePath, 'utf8').trim(); } catch { return null; }
}

function writeFileSafe(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  } catch {
    // Silent fail — never block session on filesystem errors
  }
}

function readActiveMode() {
  const raw = readFileSafe(FLAG_FILE);
  return raw && VALID_MODES.includes(raw) ? raw : getDefaultMode();
}

function parseCommand(prompt) {
  // Match: /prove-it [optional-subcommand]
  const match = prompt.match(/\/prove-it(?:\s+(\S+))?/i);
  if (!match) return null;

  const sub = (match[1] || '').toLowerCase().trim();

  if (!sub) return { action: 'show' };
  if (sub === 'on') return { action: 'on' };
  if (sub === 'off') return { action: 'off' };
  if (sub === 'status') return { action: 'status' };
  if (VALID_MODES.filter((m) => m !== 'off').includes(sub)) return { action: 'set', mode: sub };

  return null;
}

function main() {
  // Read prompt from stdin (Claude Code pipes the prompt as JSON or plain text)
  let input = '';
  try {
    input = fs.readFileSync('/dev/stdin', 'utf8');
  } catch {
    process.exit(0);
  }

  // Try to parse as JSON (Claude Code hook format)
  let prompt = input;
  try {
    const parsed = JSON.parse(input);
    prompt = parsed.prompt || parsed.message || parsed.content || input;
  } catch {
    // Not JSON — treat as plain text
  }

  const currentMode = readActiveMode();
  const cmd = parseCommand(prompt);

  if (!cmd) {
    process.exit(0);
  }

  switch (cmd.action) {
    case 'show': {
      const lastResult = readFileSafe(LAST_RESULT_FILE);
      const resultLine = lastResult ? ` | Last result: ${lastResult}` : '';
      process.stdout.write(`prove-it: mode=${currentMode}${resultLine}\n`);
      break;
    }

    case 'status': {
      const lastResult = readFileSafe(LAST_RESULT_FILE);
      process.stdout.write(
        `prove-it status\n` +
        `───────────────\n` +
        `Mode:        ${currentMode}\n` +
        `Last result: ${lastResult || 'none'}\n`
      );
      break;
    }

    case 'set': {
      writeFileSafe(PREV_MODE_FILE, currentMode);
      writeFileSafe(FLAG_FILE, cmd.mode);
      process.stdout.write(`prove-it: switched to ${cmd.mode} mode\n`);
      break;
    }

    case 'off': {
      writeFileSafe(PREV_MODE_FILE, currentMode);
      writeFileSafe(FLAG_FILE, 'off');
      process.stdout.write(`prove-it: suspended. Remember to run tests before shipping.\n`);
      break;
    }

    case 'on': {
      const prevMode = readFileSafe(PREV_MODE_FILE);
      const resumeMode = (prevMode && VALID_MODES.includes(prevMode) && prevMode !== 'off')
        ? prevMode
        : getDefaultMode();
      writeFileSafe(FLAG_FILE, resumeMode);
      process.stdout.write(`prove-it: resumed (${resumeMode} mode)\n`);
      break;
    }
  }

  process.exit(0);
}

main();

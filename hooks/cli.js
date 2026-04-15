#!/usr/bin/env node
/**
 * prove-it CLI — npx entry point
 *
 * Usage:
 *   npx @gaming.big/prove-it install
 *   npx @gaming.big/prove-it install --global
 *   npx @gaming.big/prove-it install --mode=tdd
 *   npx @gaming.big/prove-it install --only=commit,review
 *   npx @gaming.big/prove-it list
 *   npx @gaming.big/prove-it update
 *   npx @gaming.big/prove-it uninstall
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PACKAGE_DIR = path.resolve(__dirname, '..');
const RULES_SOURCE = path.join(PACKAGE_DIR, '.cursor', 'rules');

const ALL_RULES = [
  'prove-it.mdc',
  'prove-it-tdd.mdc',
  'prove-it-strict.mdc',
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  const flags = {};
  for (const arg of args.slice(1)) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      flags[key] = val !== undefined ? val : true;
    }
  }
  return { command, flags };
}

function findProjectRoot() {
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function getTargetDir(flags) {
  if (flags.global) {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA || os.homedir(), 'Cursor', 'rules');
    }
    return path.join(os.homedir(), '.cursor', 'rules');
  }
  return path.join(findProjectRoot(), '.cursor', 'rules');
}

function resolveRules(flags) {
  if (flags.only) {
    const names = flags.only.split(',').map((n) => n.trim());
    return names
      .map((n) => (n.endsWith('.mdc') ? n : `prove-it-${n}.mdc`))
      .filter((n) => ALL_RULES.includes(n) || n === 'prove-it.mdc');
  }
  return ALL_RULES;
}

function cmdInstall(flags) {
  const targetDir = getTargetDir(flags);
  const rules = resolveRules(flags);

  fs.mkdirSync(targetDir, { recursive: true });

  const installed = [];
  const skipped = [];

  for (const rule of rules) {
    const src = path.join(RULES_SOURCE, rule);
    const dest = path.join(targetDir, rule);

    if (!fs.existsSync(src)) {
      console.warn(`  Warning: ${rule} not found in package — skipping`);
      continue;
    }

    if (fs.existsSync(dest) && !flags.force) {
      skipped.push(rule);
      continue;
    }

    fs.copyFileSync(src, dest);
    installed.push(rule);
  }

  const scope = flags.global ? 'global' : 'project';
  console.log(`\n✓ prove-it installed (${scope})\n`);
  console.log(`  Target: ${targetDir}`);

  if (installed.length) {
    console.log(`  Installed:`);
    installed.forEach((r) => console.log(`    + ${r}`));
  }
  if (skipped.length) {
    console.log(`  Skipped (already exist — use --force to overwrite):`);
    skipped.forEach((r) => console.log(`    = ${r}`));
  }

  console.log(`\n  How to enable in Cursor:`);
  console.log(`    1. Open Cursor Settings → Rules`);
  console.log(`    2. prove-it.mdc is always-on by default`);
  console.log(`    3. Toggle prove-it-tdd.mdc or prove-it-strict.mdc for those modes\n`);
}

function cmdList(flags) {
  const targetDir = getTargetDir(flags);
  console.log(`\nprove-it rules in ${targetDir}:\n`);

  for (const rule of ALL_RULES) {
    const dest = path.join(targetDir, rule);
    const exists = fs.existsSync(dest);
    const status = exists ? '✓' : '✗';
    const note = rule === 'prove-it.mdc' ? ' (alwaysApply)' : ' (toggle in Cursor UI)';
    console.log(`  ${status} ${rule}${note}`);
  }
  console.log('');
}

function cmdUpdate(flags) {
  const targetDir = getTargetDir(flags);
  const rules = ALL_RULES.filter((r) => fs.existsSync(path.join(targetDir, r)));

  if (!rules.length) {
    console.log('No prove-it rules found to update. Run `npx @gaming.big/prove-it install` first.');
    return;
  }

  for (const rule of rules) {
    const src = path.join(RULES_SOURCE, rule);
    const dest = path.join(targetDir, rule);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Updated ${rule}`);
    }
  }
  console.log(`\n✓ prove-it updated\n`);
}

function cmdUninstall(flags) {
  const targetDir = getTargetDir(flags);
  let removed = 0;

  for (const rule of ALL_RULES) {
    const dest = path.join(targetDir, rule);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      console.log(`  Removed ${dest}`);
      removed++;
    }
  }

  if (removed) {
    console.log(`\n✓ prove-it uninstalled\n`);
  } else {
    console.log('No prove-it rules found to remove.');
  }
}

function printHelp() {
  console.log(`
prove-it — verification-first workflow for AI coding agents

Usage:
  npx @gaming.big/prove-it <command> [options]

Commands:
  install     Copy prove-it rules to .cursor/rules/ (default: project-level)
  list        Show which rules are installed
  update      Update installed rules to the latest version
  uninstall   Remove prove-it rules

Options:
  --global      Install to ~/.cursor/rules/ instead of project
  --force       Overwrite existing rules
  --only=<r>    Install only specific rules (comma-separated: tdd,strict)

Examples:
  npx @gaming.big/prove-it install
  npx @gaming.big/prove-it install --global
  npx @gaming.big/prove-it install --only=tdd,strict
  npx @gaming.big/prove-it install --force
  npx @gaming.big/prove-it list --global
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const { command, flags } = parseArgs(process.argv);

switch (command) {
  case 'install':   cmdInstall(flags); break;
  case 'list':      cmdList(flags); break;
  case 'update':    cmdUpdate(flags); break;
  case 'uninstall': cmdUninstall(flags); break;
  default:          printHelp();
}

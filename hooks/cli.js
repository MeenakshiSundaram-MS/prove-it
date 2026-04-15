#!/usr/bin/env node
/**
 * prove-it CLI — npx entry point
 *
 * Usage:
 *   npx @developed-by-ms/prove-it install
 *   npx @developed-by-ms/prove-it install --global
 *   npx @developed-by-ms/prove-it install --mode=tdd
 *   npx @developed-by-ms/prove-it install --mode=strict
 *   npx @developed-by-ms/prove-it install --all
 *   npx @developed-by-ms/prove-it install --only=tdd,strict
 *   npx @developed-by-ms/prove-it list
 *   npx @developed-by-ms/prove-it update
 *   npx @developed-by-ms/prove-it uninstall
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKAGE_DIR = path.resolve(__dirname, '..');
const RULES_SOURCE = path.join(PACKAGE_DIR, '.cursor', 'rules');

const ALL_RULES = [
  'prove-it.mdc',
  'prove-it-tdd.mdc',
  'prove-it-strict.mdc',
];

// Platform files installed by --all (relative to project root)
const PLATFORM_FILES = [
  {
    src: path.join(PACKAGE_DIR, '.windsurf', 'rules', 'prove-it.md'),
    destRel: path.join('.windsurf', 'rules', 'prove-it.md'),
    label: 'Windsurf',
  },
  {
    src: path.join(PACKAGE_DIR, '.clinerules', 'prove-it.md'),
    destRel: path.join('.clinerules', 'prove-it.md'),
    label: 'Cline',
  },
  {
    src: path.join(PACKAGE_DIR, '.github', 'copilot-instructions.md'),
    destRel: path.join('.github', 'copilot-instructions.md'),
    label: 'Copilot',
  },
  {
    src: path.join(PACKAGE_DIR, '.codex', 'instructions.md'),
    destRel: path.join('.codex', 'instructions.md'),
    label: 'Codex',
  },
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
    const rules = names.map((n) => (n.endsWith('.mdc') ? n : `prove-it-${n}.mdc`));
    // Always include core rule — without it the mode add-ons have nothing to build on
    if (!rules.includes('prove-it.mdc')) rules.unshift('prove-it.mdc');
    return rules.filter((n) => ALL_RULES.includes(n));
  }
  // --mode=tdd  → core + tdd rule only
  // --mode=strict → core + strict rule only
  // --mode=verify or no mode → all three rules
  if (flags.mode && flags.mode !== 'verify') {
    const modeRule = `prove-it-${flags.mode}.mdc`;
    if (ALL_RULES.includes(modeRule)) return ['prove-it.mdc', modeRule];
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
  console.log(`    3. Toggle prove-it-tdd.mdc or prove-it-strict.mdc for those modes`);

  // --all: also install platform files for Windsurf, Cline, Copilot, Codex
  if (flags.all && !flags.global) {
    cmdInstallPlatforms(flags);
  }

  console.log('');
}

function cmdInstallPlatforms(flags) {
  const projectRoot = findProjectRoot();
  const platformInstalled = [];
  const platformSkipped = [];

  console.log(`\n  Installing platform files (--all):`);

  for (const pf of PLATFORM_FILES) {
    const dest = path.join(projectRoot, pf.destRel);

    if (!fs.existsSync(pf.src)) {
      console.warn(`  Warning: ${pf.label} source not found in package — skipping`);
      continue;
    }

    if (fs.existsSync(dest) && !flags.force) {
      platformSkipped.push(pf.label);
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(pf.src, dest);
    platformInstalled.push(`${pf.label} (${pf.destRel})`);
  }

  if (platformInstalled.length) {
    console.log(`  Platform files installed:`);
    platformInstalled.forEach((r) => console.log(`    + ${r}`));
  }
  if (platformSkipped.length) {
    console.log(`  Platform files skipped (already exist — use --force to overwrite):`);
    platformSkipped.forEach((r) => console.log(`    = ${r}`));
  }
  if (platformInstalled.length) {
    console.log(`\n  Commit these files so your whole team gets them:`);
    console.log(`    git add .windsurf .clinerules .github/copilot-instructions.md .codex`);
    console.log(`    git commit -m "chore: add prove-it verification rules"`);
  }
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
    console.log('No prove-it rules found to update. Run `npx @developed-by-ms/prove-it install` first.');
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
  npx @developed-by-ms/prove-it <command> [options]

Commands:
  install     Copy prove-it rules to .cursor/rules/ (default: project-level)
  list        Show which rules are installed
  update      Update installed rules to the latest version
  uninstall   Remove prove-it rules

Options:
  --global        Install to ~/.cursor/rules/ instead of project
  --force         Overwrite existing rules
  --mode=<mode>   Install core + mode rule only: tdd or strict
  --only=<r>      Install only specific rules (comma-separated: tdd,strict)
  --all           Also install Windsurf, Cline, Copilot, Codex files

Examples:
  npx @developed-by-ms/prove-it install
  npx @developed-by-ms/prove-it install --global
  npx @developed-by-ms/prove-it install --mode=tdd
  npx @developed-by-ms/prove-it install --mode=strict
  npx @developed-by-ms/prove-it install --all
  npx @developed-by-ms/prove-it install --only=tdd,strict
  npx @developed-by-ms/prove-it install --force
  npx @developed-by-ms/prove-it list --global
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

module.exports = { parseArgs, resolveRules, findProjectRoot, getTargetDir };

if (require.main === module) {
  const { command, flags } = parseArgs(process.argv);

  switch (command) {
    case 'install':   cmdInstall(flags); break;
    case 'list':      cmdList(flags); break;
    case 'update':    cmdUpdate(flags); break;
    case 'uninstall': cmdUninstall(flags); break;
    default:          printHelp();
  }
}

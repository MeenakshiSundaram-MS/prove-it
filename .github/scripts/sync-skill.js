#!/usr/bin/env node
/**
 * sync-skill.js — Distributes skills/prove-it/SKILL.md to all platform targets.
 *
 * Platform targets:
 *   - .cursor/rules/prove-it.mdc        (adds alwaysApply: true frontmatter)
 *   - .windsurf/rules/prove-it.md       (adds trigger: always_on frontmatter)
 *   - .clinerules/prove-it.md           (plain markdown, no frontmatter)
 *   - .github/copilot-instructions.md   (plain markdown)
 *   - .codex/instructions.md            (plain markdown)
 *
 * The hand-authored .mdc files for tdd and strict modes are NOT overwritten —
 * they have additional structure beyond what SKILL.md contains.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SKILL_FILE = path.join(ROOT, 'skills', 'prove-it', 'SKILL.md');

function readSkill() {
  return fs.readFileSync(SKILL_FILE, 'utf8');
}

function stripFrontmatter(content) {
  // Remove YAML frontmatter (--- ... ---)
  return content.replace(/^---[\s\S]*?---\n/, '').trim();
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Synced: ${path.relative(ROOT, filePath)}`);
}

function syncCursor(skillContent) {
  const body = stripFrontmatter(skillContent);
  const mdc = [
    '---',
    'description: "prove-it: verification-first workflow. Never say done without proof."',
    'alwaysApply: true',
    '---',
    '',
    body,
    '',
  ].join('\n');
  writeFile(path.join(ROOT, '.cursor', 'rules', 'prove-it.mdc'), mdc);
}

function syncWindsurf(skillContent) {
  const body = stripFrontmatter(skillContent);
  const md = [
    '---',
    'trigger: always_on',
    'description: "prove-it: verification-first workflow. Never say done without proof."',
    '---',
    '',
    body,
    '',
  ].join('\n');
  writeFile(path.join(ROOT, '.windsurf', 'rules', 'prove-it.md'), md);
}

function syncPlain(skillContent, targetPath) {
  const body = stripFrontmatter(skillContent);
  writeFile(path.join(ROOT, targetPath), body + '\n');
}

function main() {
  const skillContent = readSkill();
  console.log('Syncing SKILL.md to platform files...');

  syncCursor(skillContent);
  syncWindsurf(skillContent);
  syncPlain(skillContent, '.clinerules/prove-it.md');
  syncPlain(skillContent, '.github/copilot-instructions.md');
  syncPlain(skillContent, '.codex/instructions.md');

  console.log('\nSync complete.');
}

main();

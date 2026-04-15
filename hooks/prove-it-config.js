#!/usr/bin/env node
/**
 * prove-it-config.js
 * Resolves configuration through a three-tier priority chain:
 *   1. PROVE_IT_DEFAULT_MODE environment variable
 *   2. ~/.config/prove-it/config.json (global user config)
 *   3. .prove-it.json in cwd (project-local config)
 *   4. Fallback: "verify"
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const VALID_MODES = ['verify', 'tdd', 'strict', 'off'];

const DEFAULT_CONFIG = {
  defaultMode: 'verify',
  suspendForPrototypes: true,
  statusBadge: true,
  requireVerificationPlan: true,
  bannedPhrasesWarning: true,
  languages: {
    autoDetect: true,
    preferredTestRunner: null,
  },
};

function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'prove-it');
  }
  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'prove-it');
  }
  return path.join(os.homedir(), '.config', 'prove-it');
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getConfig() {
  const globalConfigPath = path.join(getConfigDir(), 'config.json');
  const projectConfigPath = path.join(process.cwd(), '.prove-it.json');

  const globalConfig = readJsonSafe(globalConfigPath) || {};
  const projectConfig = readJsonSafe(projectConfigPath) || {};

  // Deep merge: DEFAULT_CONFIG < globalConfig < projectConfig
  return Object.assign({}, DEFAULT_CONFIG, globalConfig, projectConfig, {
    languages: Object.assign(
      {},
      DEFAULT_CONFIG.languages,
      globalConfig.languages || {},
      projectConfig.languages || {}
    ),
  });
}

function getDefaultMode() {
  // Priority 1: environment variable
  const envMode = process.env.PROVE_IT_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode)) {
    return envMode;
  }

  // Priority 2 & 3: config files (project-local overrides global)
  const config = getConfig();
  if (config.defaultMode && VALID_MODES.includes(config.defaultMode)) {
    return config.defaultMode;
  }

  // Priority 4: hardcoded default
  return 'verify';
}

module.exports = { getDefaultMode, getConfig, getConfigDir, VALID_MODES };

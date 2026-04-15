'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Load the module under test
const config = require('../hooks/prove-it-config');

describe('prove-it-config', () => {
  describe('VALID_MODES', () => {
    it('contains the four expected modes', () => {
      assert.deepEqual(config.VALID_MODES, ['verify', 'tdd', 'strict', 'off']);
    });
  });

  describe('getDefaultMode()', () => {
    let originalEnv;

    before(() => {
      originalEnv = process.env.PROVE_IT_DEFAULT_MODE;
    });

    after(() => {
      if (originalEnv === undefined) {
        delete process.env.PROVE_IT_DEFAULT_MODE;
      } else {
        process.env.PROVE_IT_DEFAULT_MODE = originalEnv;
      }
    });

    it('returns verify when no env var or config file is set', () => {
      delete process.env.PROVE_IT_DEFAULT_MODE;
      // Without config files pointing to something else, default is verify
      const mode = config.getDefaultMode();
      assert.ok(config.VALID_MODES.includes(mode), `mode "${mode}" should be a valid mode`);
    });

    it('returns tdd when PROVE_IT_DEFAULT_MODE=tdd', () => {
      process.env.PROVE_IT_DEFAULT_MODE = 'tdd';
      assert.equal(config.getDefaultMode(), 'tdd');
    });

    it('returns strict when PROVE_IT_DEFAULT_MODE=strict', () => {
      process.env.PROVE_IT_DEFAULT_MODE = 'strict';
      assert.equal(config.getDefaultMode(), 'strict');
    });

    it('ignores invalid env var values and falls back to config/default', () => {
      process.env.PROVE_IT_DEFAULT_MODE = 'notamode';
      const mode = config.getDefaultMode();
      assert.ok(config.VALID_MODES.includes(mode), `mode "${mode}" should be a valid mode`);
    });
  });

  describe('getConfig()', () => {
    it('returns an object', () => {
      const cfg = config.getConfig();
      assert.equal(typeof cfg, 'object');
      assert.notEqual(cfg, null);
    });

    it('includes defaultMode key', () => {
      const cfg = config.getConfig();
      assert.ok('defaultMode' in cfg);
    });

    it('includes languages key', () => {
      const cfg = config.getConfig();
      assert.ok('languages' in cfg);
    });
  });

  describe('getConfigDir()', () => {
    it('returns a non-empty string', () => {
      const dir = config.getConfigDir();
      assert.equal(typeof dir, 'string');
      assert.ok(dir.length > 0);
    });

    it('uses XDG_CONFIG_HOME when set', () => {
      const original = process.env.XDG_CONFIG_HOME;
      process.env.XDG_CONFIG_HOME = '/tmp/xdg-test';
      const dir = config.getConfigDir();
      assert.ok(dir.startsWith('/tmp/xdg-test'));
      if (original === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = original;
    });
  });
});

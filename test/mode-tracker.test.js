'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseCommand } = require('../hooks/prove-it-mode-tracker');

describe('prove-it-mode-tracker: parseCommand()', () => {
  describe('no command', () => {
    it('returns null for plain text with no /prove-it', () => {
      assert.equal(parseCommand('fix the null check in getUserProfile'), null);
    });

    it('returns null for empty string', () => {
      assert.equal(parseCommand(''), null);
    });
  });

  describe('/prove-it (bare)', () => {
    it('returns show action', () => {
      assert.deepEqual(parseCommand('/prove-it'), { action: 'show' });
    });

    it('is case-insensitive', () => {
      assert.deepEqual(parseCommand('/PROVE-IT'), { action: 'show' });
    });

    it('returns null when /prove-it is followed by an unrecognized word', () => {
      // "/prove-it what" — "what" is captured as unknown subcommand → null
      // Users should type /prove-it alone or /prove-it <valid-mode>
      const result = parseCommand('hey /prove-it what mode are we in?');
      assert.equal(result, null);
    });
  });

  describe('/prove-it status', () => {
    it('returns status action', () => {
      assert.deepEqual(parseCommand('/prove-it status'), { action: 'status' });
    });
  });

  describe('/prove-it tdd', () => {
    it('returns set action with tdd mode', () => {
      assert.deepEqual(parseCommand('/prove-it tdd'), { action: 'set', mode: 'tdd' });
    });
  });

  describe('/prove-it strict', () => {
    it('returns set action with strict mode', () => {
      assert.deepEqual(parseCommand('/prove-it strict'), { action: 'set', mode: 'strict' });
    });
  });

  describe('/prove-it verify', () => {
    it('returns set action with verify mode', () => {
      assert.deepEqual(parseCommand('/prove-it verify'), { action: 'set', mode: 'verify' });
    });
  });

  describe('/prove-it off', () => {
    it('returns off action', () => {
      assert.deepEqual(parseCommand('/prove-it off'), { action: 'off' });
    });
  });

  describe('/prove-it on', () => {
    it('returns on action', () => {
      assert.deepEqual(parseCommand('/prove-it on'), { action: 'on' });
    });
  });

  describe('invalid subcommands', () => {
    it('returns null for unknown subcommand', () => {
      assert.equal(parseCommand('/prove-it foobar'), null);
    });

    it('returns null for /prove-it 123', () => {
      assert.equal(parseCommand('/prove-it 123'), null);
    });
  });
});

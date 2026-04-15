'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs, resolveRules } = require('../hooks/cli');

describe('prove-it CLI: parseArgs()', () => {
  it('parses install command with no flags', () => {
    const { command, flags } = parseArgs(['node', 'cli.js', 'install']);
    assert.equal(command, 'install');
    assert.deepEqual(flags, {});
  });

  it('parses --global flag', () => {
    const { command, flags } = parseArgs(['node', 'cli.js', 'install', '--global']);
    assert.equal(command, 'install');
    assert.equal(flags.global, true);
  });

  it('parses --force flag', () => {
    const { flags } = parseArgs(['node', 'cli.js', 'install', '--force']);
    assert.equal(flags.force, true);
  });

  it('parses --mode=tdd', () => {
    const { flags } = parseArgs(['node', 'cli.js', 'install', '--mode=tdd']);
    assert.equal(flags.mode, 'tdd');
  });

  it('parses --mode=strict', () => {
    const { flags } = parseArgs(['node', 'cli.js', 'install', '--mode=strict']);
    assert.equal(flags.mode, 'strict');
  });

  it('parses --only=tdd,strict', () => {
    const { flags } = parseArgs(['node', 'cli.js', 'install', '--only=tdd,strict']);
    assert.equal(flags.only, 'tdd,strict');
  });

  it('parses --all flag', () => {
    const { flags } = parseArgs(['node', 'cli.js', 'install', '--all']);
    assert.equal(flags.all, true);
  });

  it('returns undefined command when no args given', () => {
    const { command } = parseArgs(['node', 'cli.js']);
    assert.equal(command, undefined);
  });
});

describe('prove-it CLI: resolveRules()', () => {
  const ALL = ['prove-it.mdc', 'prove-it-tdd.mdc', 'prove-it-strict.mdc'];

  it('returns all rules when no flags', () => {
    assert.deepEqual(resolveRules({}), ALL);
  });

  it('returns all rules for --mode=verify', () => {
    assert.deepEqual(resolveRules({ mode: 'verify' }), ALL);
  });

  it('returns core + tdd for --mode=tdd', () => {
    assert.deepEqual(resolveRules({ mode: 'tdd' }), ['prove-it.mdc', 'prove-it-tdd.mdc']);
  });

  it('returns core + strict for --mode=strict', () => {
    assert.deepEqual(resolveRules({ mode: 'strict' }), ['prove-it.mdc', 'prove-it-strict.mdc']);
  });

  it('ignores unknown mode values and returns all rules', () => {
    const result = resolveRules({ mode: 'notamode' });
    assert.deepEqual(result, ALL);
  });

  it('returns core + tdd for --only=tdd', () => {
    const result = resolveRules({ only: 'tdd' });
    assert.ok(result.includes('prove-it.mdc'), 'core rule must always be included');
    assert.ok(result.includes('prove-it-tdd.mdc'));
  });

  it('returns core + strict for --only=strict', () => {
    const result = resolveRules({ only: 'strict' });
    assert.ok(result.includes('prove-it.mdc'));
    assert.ok(result.includes('prove-it-strict.mdc'));
  });

  it('core rule already present in --only=prove-it.mdc is not duplicated', () => {
    const result = resolveRules({ only: 'prove-it.mdc' });
    const coreCount = result.filter((r) => r === 'prove-it.mdc').length;
    assert.equal(coreCount, 1, 'prove-it.mdc should not be duplicated');
  });

  it('filters out unknown rule names in --only', () => {
    const result = resolveRules({ only: 'tdd,notarule' });
    assert.ok(!result.includes('prove-it-notarule.mdc'));
  });
});

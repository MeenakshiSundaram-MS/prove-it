'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { detectProject, detectNodeFramework, detectPythonFramework } = require('../hooks/prove-it-activate');

// Helper: create a temp directory with given files
function makeTempProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prove-it-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }
  return dir;
}

function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('prove-it-activate: detectProject()', () => {
  describe('Node.js projects', () => {
    let dir;
    after(() => { if (dir) removeTempDir(dir); });

    it('detects jest from devDependencies', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({ devDependencies: { jest: '^29.0.0' } }),
      });
      const result = detectProject(dir);
      assert.equal(result.lang, 'node');
      assert.equal(result.framework, 'jest');
      assert.equal(result.testCmd, 'npx jest --passWithNoTests');
    });

    it('detects vitest from devDependencies', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      });
      const result = detectProject(dir);
      assert.equal(result.lang, 'node');
      assert.equal(result.framework, 'vitest');
      assert.equal(result.testCmd, 'npx vitest run');
    });

    it('includes TypeScript type-check command when typescript is in deps', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({
          devDependencies: { jest: '^29.0.0', typescript: '^5.0.0' },
        }),
      });
      const result = detectProject(dir);
      assert.equal(result.typeCheckCmd, 'npx tsc --noEmit');
    });

    it('sets typeCheckCmd to null when no typescript', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({ devDependencies: { jest: '^29.0.0' } }),
      });
      const result = detectProject(dir);
      assert.equal(result.typeCheckCmd, null);
    });

    it('falls back to npm test when package.json has custom test script', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({
          scripts: { test: 'node test.js' },
        }),
      });
      const result = detectProject(dir);
      assert.equal(result.lang, 'node');
      assert.equal(result.testCmd, 'npm test');
    });

    it('sets testCmd to null for bare package.json with no test config', () => {
      dir = makeTempProject({
        'package.json': JSON.stringify({ name: 'my-app' }),
      });
      const result = detectProject(dir);
      assert.equal(result.lang, 'node');
      assert.equal(result.testCmd, null);
    });
  });

  describe('Go projects', () => {
    let dir;
    after(() => { if (dir) removeTempDir(dir); });

    it('detects Go from go.mod', () => {
      dir = makeTempProject({ 'go.mod': 'module example.com/myapp\n\ngo 1.21\n' });
      const result = detectProject(dir);
      assert.equal(result.lang, 'go');
      assert.equal(result.testCmd, 'go test ./...');
      assert.equal(result.typeCheckCmd, 'go build ./...');
    });
  });

  describe('Rust projects', () => {
    let dir;
    after(() => { if (dir) removeTempDir(dir); });

    it('detects Rust from Cargo.toml', () => {
      dir = makeTempProject({ 'Cargo.toml': '[package]\nname = "myapp"\nversion = "0.1.0"\n' });
      const result = detectProject(dir);
      assert.equal(result.lang, 'rust');
      assert.equal(result.testCmd, 'cargo test');
    });
  });

  describe('Python projects', () => {
    let dir;
    after(() => { if (dir) removeTempDir(dir); });

    it('detects Python from pyproject.toml', () => {
      dir = makeTempProject({ 'pyproject.toml': '[tool.pytest.ini_options]\n' });
      const result = detectProject(dir);
      assert.equal(result.lang, 'python');
      assert.equal(result.testCmd, 'python -m pytest -v');
    });

    it('uses unittest when no pytest config', () => {
      dir = makeTempProject({ 'requirements.txt': 'requests\n' });
      const result = detectProject(dir);
      assert.equal(result.lang, 'python');
      assert.equal(result.testCmd, 'python -m unittest discover -v');
    });
  });

  describe('unknown project', () => {
    let dir;
    after(() => { if (dir) removeTempDir(dir); });

    it('returns null lang for empty directory', () => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prove-it-test-'));
      const result = detectProject(dir);
      assert.equal(result.lang, null);
      assert.equal(result.testCmd, null);
      assert.equal(result.typeCheckCmd, null);
    });
  });
});

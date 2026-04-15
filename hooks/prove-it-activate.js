#!/usr/bin/env node
/**
 * prove-it-activate.js — Claude Code SessionStart hook
 *
 * Runs at the start of every session. Responsibilities:
 *   1. Read active mode from flag file (or fall back to config default)
 *   2. Auto-detect project language and test framework
 *   3. Emit PROVE-IT ACTIVE context block into the session
 *   4. Emit active mode's rules (not full SKILL.md — avoids token bloat)
 *   5. Write flag file with current mode
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, getConfig, VALID_MODES } = require('./prove-it-config');

const FLAG_FILE = path.join(os.homedir(), '.claude', '.prove-it-active');

// ─── Mode flag file ───────────────────────────────────────────────────────────

function readActiveMode() {
  try {
    const raw = fs.readFileSync(FLAG_FILE, 'utf8').trim();
    return VALID_MODES.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeActiveMode(mode) {
  try {
    fs.mkdirSync(path.dirname(FLAG_FILE), { recursive: true });
    fs.writeFileSync(FLAG_FILE, mode, 'utf8');
  } catch {
    // Silent fail — never block session startup on filesystem errors
  }
}

// ─── Project detection ────────────────────────────────────────────────────────

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fileExistsUp(filename, startDir) {
  let dir = startDir;
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, filename))) return path.join(dir, filename);
    dir = path.dirname(dir);
  }
  return null;
}

function detectNodeFramework(pkgPath) {
  const pkg = readJsonSafe(pkgPath);
  if (!pkg) return null;

  const allDeps = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {}
  );

  const dir = path.dirname(pkgPath);
  const hasConfig = (names) =>
    names.some((n) =>
      ['.js', '.ts', '.mjs', '.cjs', ''].some((ext) =>
        fs.existsSync(path.join(dir, n + ext))
      )
    );

  if (allDeps['vitest'] || hasConfig(['vitest.config'])) {
    return {
      lang: 'node',
      framework: 'vitest',
      testCmd: 'npx vitest run',
      typeCheckCmd: allDeps['typescript'] ? 'npx tsc --noEmit' : null,
    };
  }
  if (allDeps['jest'] || hasConfig(['jest.config'])) {
    return {
      lang: 'node',
      framework: 'jest',
      testCmd: 'npx jest --passWithNoTests',
      typeCheckCmd: allDeps['typescript'] ? 'npx tsc --noEmit' : null,
    };
  }
  if (allDeps['mocha']) {
    return {
      lang: 'node',
      framework: 'mocha',
      testCmd: 'npx mocha',
      typeCheckCmd: allDeps['typescript'] ? 'npx tsc --noEmit' : null,
    };
  }
  if (pkg.scripts && pkg.scripts.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
    return {
      lang: 'node',
      framework: 'npm-scripts',
      testCmd: 'npm test',
      typeCheckCmd: allDeps['typescript'] ? 'npx tsc --noEmit' : null,
    };
  }
  // Node project but no test framework
  return {
    lang: 'node',
    framework: null,
    testCmd: null,
    typeCheckCmd: allDeps['typescript'] ? 'npx tsc --noEmit' : null,
  };
}

function detectPythonFramework(dir) {
  // Check for pytest config
  const hasPytest =
    fs.existsSync(path.join(dir, 'pytest.ini')) ||
    fs.existsSync(path.join(dir, 'setup.cfg')) ||
    fs.existsSync(path.join(dir, 'pyproject.toml'));

  // Check if pytest is installed
  const testCmd = hasPytest ? 'python -m pytest -v' : 'python -m unittest discover -v';

  // Check for mypy
  const hasMypyConfig =
    fs.existsSync(path.join(dir, 'mypy.ini')) ||
    fs.existsSync(path.join(dir, '.mypy.ini')) ||
    fs.existsSync(path.join(dir, 'pyproject.toml'));

  return {
    lang: 'python',
    framework: hasPytest ? 'pytest' : 'unittest',
    testCmd,
    typeCheckCmd: hasMypyConfig ? 'mypy . --ignore-missing-imports' : null,
  };
}

function detectRubyFramework(dir) {
  const gemfile = path.join(dir, 'Gemfile');
  try {
    const content = fs.readFileSync(gemfile, 'utf8');
    const hasRspec = /gem\s+['"]rspec/.test(content);
    return {
      lang: 'ruby',
      framework: hasRspec ? 'rspec' : 'minitest',
      testCmd: hasRspec ? 'bundle exec rspec' : 'ruby -Itest test/**/*_test.rb',
      typeCheckCmd: null,
    };
  } catch {
    return { lang: 'ruby', framework: 'minitest', testCmd: 'bundle exec rake test', typeCheckCmd: null };
  }
}

function detectProject(cwd) {
  // Node.js
  const pkgPath = fileExistsUp('package.json', cwd);
  if (pkgPath) return detectNodeFramework(pkgPath);

  // Go
  if (fileExistsUp('go.mod', cwd)) {
    return {
      lang: 'go',
      framework: 'go test',
      testCmd: 'go test ./...',
      typeCheckCmd: 'go build ./...',
    };
  }

  // Rust
  if (fileExistsUp('Cargo.toml', cwd)) {
    return {
      lang: 'rust',
      framework: 'cargo test',
      testCmd: 'cargo test',
      typeCheckCmd: null, // cargo test includes build
    };
  }

  // Python
  const hasPyFiles =
    fileExistsUp('pyproject.toml', cwd) ||
    fileExistsUp('setup.py', cwd) ||
    fileExistsUp('requirements.txt', cwd);
  if (hasPyFiles) {
    const dir = path.dirname(hasPyFiles) || cwd;
    return detectPythonFramework(dir);
  }

  // Java (Maven)
  if (fileExistsUp('pom.xml', cwd)) {
    return { lang: 'java', framework: 'maven', testCmd: 'mvn test -q', typeCheckCmd: 'mvn compile -q' };
  }

  // Java (Gradle)
  if (fileExistsUp('build.gradle', cwd) || fileExistsUp('build.gradle.kts', cwd)) {
    return { lang: 'java', framework: 'gradle', testCmd: './gradlew test', typeCheckCmd: './gradlew compileJava' };
  }

  // Ruby
  if (fileExistsUp('Gemfile', cwd)) {
    return detectRubyFramework(path.dirname(fileExistsUp('Gemfile', cwd)));
  }

  // Unknown
  return { lang: null, framework: null, testCmd: null, typeCheckCmd: null };
}

// ─── Rules emission ───────────────────────────────────────────────────────────

const VERIFY_RULES = `
## prove-it: verify mode (default)

Before coding:
\`\`\`
VERIFICATION PLAN
─────────────────
What done looks like: [one sentence]
How I will verify:    [exact command]
Edge cases:           [at least one]
\`\`\`

After coding — run the command, paste actual output:
\`\`\`
VERIFICATION RESULT
───────────────────
Command: [run]
Output:  [paste stdout]
Status:  PASS ✓  |  FAIL ✗
\`\`\`

Banned: "should work", "I think", "probably", "seems to be", "that should do it".
Replace with: the actual output.

If can't run: emit CANNOT VERIFY block with exact command + risk.
`.trim();

const TDD_RULES = `
## prove-it: tdd mode

Write failing test FIRST. Show red. Implement. Show green. Same test both times.

\`\`\`
RED — expected failure
──────────────────────
Command: [test cmd]
Output:  [paste failure]
\`\`\`
[implement]
\`\`\`
GREEN — passing
───────────────
Command: [same test cmd]
Output:  [paste passing]
\`\`\`

Red→Green Integrity: red and green must be for the same test name.
`.trim();

const STRICT_RULES = `
## prove-it: strict mode

Four gates, all must show PASS ✓:

Gate 1 — Compile:    [tsc --noEmit | go build | cargo build | mvn compile]
Gate 2 — Regression: full existing test suite, 0 failures (document pre-existing)
Gate 3 — New Tests:  new behavior = new tests, show passing
Gate 4 — Edge Cases: null/empty/boundary tested or documented as out-of-scope

\`\`\`
STRICT DONE
────────────
Gate 1 (compile):    PASS ✓
Gate 2 (regression): PASS ✓ (N tests)
Gate 3 (new tests):  PASS ✓ (M new tests)
Gate 4 (edges):      PASS ✓ (K tested, J documented)
\`\`\`
`.trim();

const OFF_RULES = `prove-it is suspended. Run tests before shipping.`.trim();

function getRulesForMode(mode) {
  switch (mode) {
    case 'tdd':    return TDD_RULES;
    case 'strict': return STRICT_RULES;
    case 'off':    return OFF_RULES;
    default:       return VERIFY_RULES;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const mode = readActiveMode() || getDefaultMode();
  writeActiveMode(mode);

  const project = detectProject(process.cwd());

  // Build the context block
  const langLine = project.lang
    ? `Project:      ${project.lang}${project.framework ? ` (${project.framework})` : ''}`
    : 'Project:      unknown — no test framework detected';

  const testLine = project.testCmd
    ? `Test command: ${project.testCmd}`
    : 'Test command: none detected — will generate inline test';

  const typeCheckLine = project.typeCheckCmd
    ? `Type check:   ${project.typeCheckCmd}`
    : null;

  const modeLine = mode === 'off'
    ? `Mode:         OFF (suspended)`
    : `Mode:         ${mode}`;

  const lines = [
    `PROVE-IT ACTIVE`,
    `──────────────────────────────────────`,
    langLine,
    testLine,
    typeCheckLine,
    modeLine,
    ``,
    getRulesForMode(mode),
  ].filter((l) => l !== null);

  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { detectProject, detectNodeFramework, detectPythonFramework, detectRubyFramework };

if (require.main === module) {
  main();
}

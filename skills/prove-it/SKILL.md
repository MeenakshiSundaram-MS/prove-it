---
name: prove-it
description: >
  Verification-first workflow enforcement. AI must demonstrate code works
  before claiming completion. Three modes: verify (default), tdd, strict.
  Never say done without proof.
triggers:
  - /prove-it
  - /prove-it verify
  - /prove-it tdd
  - /prove-it strict
  - /prove-it off
  - /prove-it on
  - /prove-it status
---

# prove-it

> Never say done without proof.

## Activation

Runs on every coding task by default. Suspend with `/prove-it off` only for:
- Exploratory spikes explicitly marked as throwaway
- Single one-liner rewrites with no branches, no state, no side effects
- Documentation-only changes (comments, README edits, docstrings)
- Configuration-only changes (JSON/YAML/TOML with no executable logic)

Even when suspended, acknowledge it:
`"prove-it suspended — run [cmd] before shipping."`

Resume with `/prove-it on`.

---

## Modes

| Mode     | Trigger              | Required evidence                                      |
|----------|----------------------|--------------------------------------------------------|
| `verify` | default              | Verification plan before + actual output after         |
| `tdd`    | `/prove-it tdd`      | Failing test (red) → implementation → passing (green)  |
| `strict` | `/prove-it strict`   | Compile ✓ + existing tests ✓ + new tests ✓ + edges ✓  |

Switch mode at any time: `/prove-it [verify|tdd|strict|off|on|status]`

---

## Core Protocol

### Step 1 — Verification Plan (before any code)

State this block before writing a single line of implementation. No exceptions.

```
VERIFICATION PLAN
─────────────────
What done looks like: [one sentence — the observable outcome]
How I will verify:    [exact command to run]
Edge cases:           [at least one: null input / empty collection / boundary value]
```

Do not write implementation until this block is complete.

### Step 2 — Implementation

Write the code. In `tdd` mode: write the failing test first, show it fails, then implement.

### Step 3 — Verification Result (after implementation)

Run the verification command. Paste the actual output. Then say done.

```
VERIFICATION RESULT
───────────────────
Command: [exact command run]
Output:
  [paste actual stdout/stderr — do not summarize, paste it]
Status: PASS ✓  |  FAIL ✗
```

If `FAIL ✗`: fix the code and re-run. Show the new output. Never say done on a failing result.

---

## Mode Rules

### verify (default)

Required:
1. VERIFICATION PLAN block before coding
2. Run the test or smoke-check command after coding
3. VERIFICATION RESULT block showing actual output
4. Status is `PASS ✓`

Minimum evidence: one passing test or one successful command execution with real output shown.

### tdd

Required:
1. VERIFICATION PLAN block before coding
2. Write the failing test first — no implementation yet
3. Run it. Show the red output:

```
RED — expected failure
──────────────────────
Command: [test command]
Output:
  [paste actual failure — "X is not defined", "expected X received Y", etc.]
```

4. Write minimum implementation to make the test pass
5. Run it again. Show the green output:

```
GREEN — passing
───────────────
Command: [same test command]
Output:
  [paste actual passing output — "1 passing", "PASS", etc.]
```

6. Refactor if needed — re-run after any refactor and show output
7. Say done only after green output is shown

**Red→Green Integrity:** the red and green outputs must be for the same test name.
Showing red on test A then green on test B is a violation. Fix: show both on the same test.

### strict

Four gates. All must show `PASS ✓`. None skippable.

**Gate 1 — Compile / Type Check**
```
GATE 1 — COMPILE
─────────────────
Command: [tsc --noEmit | cargo build | go build ./... | mvn compile -q]
Output:  [paste output — empty = clean]
Status:  PASS ✓
```

**Gate 2 — Existing Test Suite (regression)**
```
GATE 2 — REGRESSION
────────────────────
Command: [full test suite command]
Output:  [paste output showing pass count]
Status:  PASS ✓ (N tests, 0 failures)
```

If the suite was already failing before your change, document it — do not claim this gate passes:
`"Pre-existing failure: [test name] — not introduced by this change."`

**Gate 3 — New Tests**
```
GATE 3 — NEW TESTS
───────────────────
Tests added: [list test names or file]
Command:     [run new tests]
Output:      [paste passing output]
Status:      PASS ✓
```

**Gate 4 — Edge Cases**

For each implemented function, identify: null/nil input, empty collection, boundary values, error path.
Either write a test for each, or document why it is out of scope.

```
GATE 4 — EDGE CASES
────────────────────
Tested:     [what was covered]
Documented: [what was intentionally skipped and why]
```

**Strict Done block** — only say done after all four pass:
```
STRICT DONE
────────────
Gate 1 (compile):    PASS ✓
Gate 2 (regression): PASS ✓ (N tests)
Gate 3 (new tests):  PASS ✓ (M new tests)
Gate 4 (edges):      PASS ✓ (K tested, J documented)
```

---

## Language-Aware Verification Commands

Auto-detect the project language and test framework. Use the most specific command available.

### Node.js / TypeScript
```
Detection:  package.json exists
Priority:
  jest in devDependencies    → npx jest --passWithNoTests
  vitest in devDependencies  → npx vitest run
  "test" in scripts          → npm test
  mocha in devDependencies   → npx mocha
  fallback                   → node -e "[inline smoke test]"
Type-check (strict mode):    npx tsc --noEmit
Lint (strict mode):          npx eslint . --max-warnings=0
```

### Python
```
Detection:  *.py files or pyproject.toml or setup.py or requirements.txt
Priority:
  pytest installed           → python -m pytest -v
  unittest files present     → python -m unittest discover -v
  fallback                   → python -c "[inline smoke test]"
Type-check (strict mode):    mypy [module] --ignore-missing-imports
```

### Go
```
Detection:  go.mod exists
Test:       go test ./...
Build:      go build ./... (Gate 1)
Vet:        go vet ./... (strict, Gate 1)
```

### Rust
```
Detection:  Cargo.toml exists
Test:       cargo test
Build:      cargo build (included in cargo test)
Clippy:     cargo clippy -- -D warnings (strict, Gate 1)
```

### Java
```
Detection:  pom.xml or build.gradle
Maven:      mvn test -q
Gradle:     ./gradlew test
Compile:    mvn compile -q | ./gradlew compileJava (Gate 1)
```

### Ruby
```
Detection:  Gemfile exists
RSpec:      bundle exec rspec
Minitest:   ruby -Itest test/**/*_test.rb
```

### No Framework Detected

Do not silently skip. Instead:
1. Write a minimal inline test for the function just written
2. Run it
3. Show the output
4. Note: `# No test framework detected — inline verification only. Consider adding one.`

---

## Banned Phrases and Replacements

These phrases claim correctness without evidence. Never use them.

| Banned phrase                         | Required action                          |
|---------------------------------------|------------------------------------------|
| "This should work"                    | Show passing test output                 |
| "I think this is correct"             | Show passing test output                 |
| "This will probably fix"              | Show passing test output                 |
| "It looks like it works"              | Show the actual run output               |
| "Seems to be working"                 | Show the actual run output               |
| "That should do it"                   | Show the actual run output               |
| "I believe this handles"              | Show a test case for that scenario       |
| "You might want to test"              | You run the test — show the output       |
| "This is functionally complete"       | Show verification output                 |
| "The implementation is ready"         | Show verification output                 |
| "This looks correct to me"            | Show passing test output                 |

When you catch yourself about to use a banned phrase: stop, run the command, paste the output.

---

## Cannot Verify

Some environments prevent running code (read-only filesystem, no runtime, sandboxed context, remote files). When this happens:

**DO emit:**
```
CANNOT VERIFY — manual check required
──────────────────────────────────────
Command to run:  [exact command]
Expected output: [what passing looks like]
Risk if skipped: [specific consequence — not "things may not work"]
```

**DO NOT:**
- Silently omit the verification step
- Say "this should work" and proceed
- Claim completion without noting the gap

The cannot-verify block is the graceful-degradation path. It preserves the human's ability to verify even when the agent cannot.

---

## Quick Reference

```
/prove-it          → show current mode
/prove-it verify   → verify mode (default)
/prove-it tdd      → tdd mode
/prove-it strict   → strict mode
/prove-it off      → suspend (state reason)
/prove-it on       → resume
/prove-it status   → show mode + last verification result
```

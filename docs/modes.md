# Modes

prove-it has three modes. Pick based on the risk profile of what you're building.

## verify (default)

**When:** Day-to-day coding, refactors, small features, fixes.

**Required:**
1. VERIFICATION PLAN block before writing code
2. At least one test or command run after
3. VERIFICATION RESULT block with actual output
4. Status is PASS ✓

**Switch:** always-on by default. Disable with `/prove-it off`.

---

## tdd

**When:** New features, bug fixes where you want to prove the test actually caught the bug.

**Required:**
1. VERIFICATION PLAN block
2. Write the failing test first
3. Show RED output (the actual failure)
4. Implement the minimum code to pass
5. Show GREEN output (the same test, now passing)
6. Refactor if needed, re-show output

**Key rule — Red→Green Integrity:** The test name in RED and GREEN must be the same.
Showing red on one test and green on another is a violation.

**Switch:**
- Cursor: enable `prove-it-tdd.mdc` in rules panel
- Claude Code: `/prove-it tdd`

---

## strict

**When:** Production features, security-sensitive code, public APIs, database migrations, anything user-visible.

**Four gates, all required:**

| Gate | Checks | Pass condition |
|------|--------|----------------|
| 1 — Compile | `tsc --noEmit`, `go build`, `cargo build`, `mvn compile` | Zero errors |
| 2 — Regression | Full existing test suite | Zero new failures (pre-existing ones must be documented) |
| 3 — New Tests | Tests for the new behavior | All passing |
| 4 — Edge Cases | null/empty/boundary/error paths | Each tested or documented as out-of-scope |

**Switch:**
- Cursor: enable `prove-it-strict.mdc` in rules panel
- Claude Code: `/prove-it strict`

---

## Decision guide

```
Is this throwaway / prototype?
  YES → /prove-it off (acknowledge with run command)
  NO  ↓

Is it production / security / API / migration?
  YES → strict
  NO  ↓

Is it a new feature or bug fix?
  YES → tdd (prove the test caught the bug)
  NO  → verify (default, always on)
```

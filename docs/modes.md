# Modes

prove-it has three modes. Pick based on the risk profile of what you're building.

---

## verify (default)

**When:** Day-to-day coding, refactors, small features, fixes.

**Required output:**
1. `VERIFICATION PLAN` block before writing code
2. At least one test or command run after
3. `VERIFICATION RESULT` block with actual output pasted
4. Status shows `PASS ✓`

**How to enable:**

| Platform | Action |
|----------|--------|
| Claude Code | Always on. `/prove-it verify` to return from another mode |
| Cursor | `prove-it.mdc` is `alwaysApply: true` — no action needed |
| Windsurf | `.windsurf/rules/prove-it.md` present = always active |
| Cline | `.clinerules/prove-it.md` present = always active |
| Copilot | `.github/copilot-instructions.md` present = always active |
| Codex | `.codex/instructions.md` present = always active |

---

## tdd

**When:** New features, bug fixes where you want proof the test actually caught the bug.

**Required output:**
1. `VERIFICATION PLAN` block
2. Write the failing test first
3. **RED block** — run the test, paste the actual failure output
4. Implement the minimum code to pass
5. **GREEN block** — run the same test, paste the passing output
6. If you refactor: run again and show output

**Red→Green Integrity Rule:** The test name in RED and GREEN must be identical.
Showing red on one test and green on a different test is a protocol violation.

**How to enable:**

| Platform | Action |
|----------|--------|
| Claude Code | `/prove-it tdd` |
| Cursor | Settings → Rules → toggle `prove-it-tdd.mdc` on |
| Windsurf | Copy `.cursor/rules/prove-it-tdd.mdc` body → `.windsurf/rules/prove-it-tdd.md` |
| Cline | Copy `.cursor/rules/prove-it-tdd.mdc` body → `.clinerules/prove-it-tdd.md` |
| Copilot | Prepend to your prompt: "Use TDD mode: write the failing test first, show RED output, then implement." |
| Codex | Add `Active mode: tdd` to `.codex/instructions.md` |

---

## strict

**When:** Production features, security-sensitive code, public APIs, database migrations, anything user-visible.

**Four gates — all required:**

| Gate | What is checked | Pass condition |
|------|----------------|----------------|
| 1 — Compile | `tsc --noEmit`, `go build`, `cargo build`, `mvn compile -q` | Zero errors |
| 2 — Regression | Full existing test suite | Zero new failures (pre-existing failures must be documented, not hidden) |
| 3 — New tests | Tests specifically for the new behavior | All passing |
| 4 — Edge cases | null/empty/boundary/error paths | Each tested or explicitly documented as out-of-scope |

The final `STRICT DONE` block must list all four gates with `PASS ✓`.

**How to enable:**

| Platform | Action |
|----------|--------|
| Claude Code | `/prove-it strict` |
| Cursor | Settings → Rules → toggle `prove-it-strict.mdc` on |
| Windsurf | Copy `.cursor/rules/prove-it-strict.mdc` body → `.windsurf/rules/prove-it-strict.md` |
| Cline | Copy `.cursor/rules/prove-it-strict.mdc` body → `.clinerules/prove-it-strict.md` |
| Copilot | Prepend to your prompt: "Use strict mode: run all 4 gates (compile, regression, new tests, edge cases) and show output for each." |
| Codex | Add `Active mode: strict` to `.codex/instructions.md` |

**Note for Cursor:** enable at most one mode add-on. If both `prove-it-tdd.mdc` and `prove-it-strict.mdc` are enabled, strict takes precedence.

---

## off

**When:** Explicitly throwaway prototypes, docs-only changes, config-only changes, one-liner rewrites with no branches or side effects.

The agent must acknowledge suspension explicitly:
```
prove-it suspended — run [exact command] before shipping.
```

Silence is not acknowledgement. The run command must be stated.

**How to enable:**

| Platform | Action |
|----------|--------|
| Claude Code | `/prove-it off` — use `/prove-it on` or `/prove-it verify` to resume |
| Cursor | Disable `prove-it.mdc` in Settings → Rules (re-enable after) |
| Windsurf | Remove or rename `.windsurf/rules/prove-it.md` |
| Cline | Delete `.clinerules/prove-it.md` or use Cline's rules toggle |
| Copilot | Remove `.github/copilot-instructions.md` |
| Codex | Remove `.codex/instructions.md` |

---

## Decision guide

```
Is this throwaway / prototype?
  YES → off (acknowledge with explicit run command)
  NO  ↓

Is it production / security / API / migration?
  YES → strict
  NO  ↓

Is it a new feature or bug fix?
  YES → tdd (prove the test caught the bug)
  NO  → verify (default, always on)
```

---

## Per-project default mode (Claude Code only)

Add `.prove-it.json` to the project root:

```json
{ "defaultMode": "strict" }
```

Config priority (highest to lowest):
1. `PROVE_IT_DEFAULT_MODE` environment variable
2. `~/.config/prove-it/config.json` (global user override)
3. `.prove-it.json` in project root
4. `"verify"` (built-in default)

Common patterns:
- Prototype repos: `{ "defaultMode": "off" }`
- Production services: `{ "defaultMode": "strict" }`
- Most projects: omit `.prove-it.json` entirely

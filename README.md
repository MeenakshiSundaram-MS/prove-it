# prove-it

> AI coding agents confidently ship broken code. prove-it fixes this.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/prove-it)](https://www.npmjs.com/package/prove-it)
[![Works with Claude Code](https://img.shields.io/badge/Claude_Code-supported-blueviolet)](https://claude.ai/code)
[![Works with Cursor](https://img.shields.io/badge/Cursor-supported-blue)](https://cursor.com)
[![Works with Windsurf](https://img.shields.io/badge/Windsurf-supported-teal)](https://codeium.com/windsurf)

**Never say done without proof.**

prove-it enforces a verification-first protocol on AI coding agents. Before claiming completion, the agent must state what "done" looks like, run the code, and show real output. Not "this should work" — actual evidence.

---

## The problem

```
You: "Add null check to getUserProfile"

AI:  "I've added a null check to getUserProfile. The implementation looks
     correct and should handle the edge case properly. The code is ready."
```

No test was run. No output was shown. This ships with bugs.

Research shows AI coding agents produce **1.7× more bugs** and have **60–80% failure rates on multi-step tasks**. The root cause is not capability — it is protocol. Agents are never required to demonstrate evidence before saying done.

---

## After prove-it

```
You: "Add null check to getUserProfile"

AI:
VERIFICATION PLAN
─────────────────
What done looks like: getUserProfile returns null safely when user not found
How I will verify:    npx jest --testPathPattern=getUserProfile
Edge cases:           null userId, user not in DB, DB unavailable

[implements code]

VERIFICATION RESULT
───────────────────
Command: npx jest --testPathPattern=getUserProfile
Output:
  ✓ returns null when userId is null (4ms)
  ✓ returns null when user not found (12ms)
  ✓ returns user object when found (8ms)
  Tests: 3 passed, 3 total
Status: PASS ✓
```

---

## Install

### Claude Code

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.sh)
```

Installs `SessionStart` and `UserPromptSubmit` hooks into `~/.claude/settings.json`. At session start, auto-detects your project's language and test framework, and emits a `PROVE-IT ACTIVE` context block. Adds a blue `[PROVE-IT]` badge to the status bar.

Switch modes with `/prove-it tdd`, `/prove-it strict`, `/prove-it off`.

### Cursor

```bash
npx @gaming.big/prove-it install
```

Copies three `.mdc` rule files to `.cursor/rules/`. `prove-it.mdc` is always-on. Toggle TDD and strict modes in **Cursor Settings → Rules**. Commit the files so your whole team gets them.

```bash
npx @gaming.big/prove-it install --global   # applies to all your projects
npx @gaming.big/prove-it install --force    # overwrite existing rules
```

### Windsurf

```bash
mkdir -p .windsurf/rules
curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/.windsurf/rules/prove-it.md \
  -o .windsurf/rules/prove-it.md
git add .windsurf/rules/prove-it.md && git commit -m "chore: add prove-it"
```

### Cline

```bash
mkdir -p .clinerules
curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/.clinerules/prove-it.md \
  -o .clinerules/prove-it.md
git add .clinerules/prove-it.md && git commit -m "chore: add prove-it"
```

### GitHub Copilot

```bash
mkdir -p .github
curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/.github/copilot-instructions.md \
  -o .github/copilot-instructions.md
git add .github/copilot-instructions.md && git commit -m "chore: add prove-it"
```

Applies to Copilot Chat (inline chat and chat panel). Requires workspace context to be enabled in VS Code.

### Codex (OpenAI)

```bash
mkdir -p .codex
curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/.codex/instructions.md \
  -o .codex/instructions.md
git add .codex/instructions.md && git commit -m "chore: add prove-it"
```

For detailed setup, verification steps, and mode switching for every platform, see [AGENTS.md](AGENTS.md).

---

## Modes

| Mode | When to use | What's required |
|------|-------------|-----------------|
| `verify` | Default, all coding | VERIFICATION PLAN before + VERIFICATION RESULT after |
| `tdd` | New features, bug fixes | Write failing test (red), then implement (green) |
| `strict` | Production, APIs, migrations | Compile ✓ + regression ✓ + new tests ✓ + edges ✓ |

Switch modes in Cursor's rules panel (toggle `prove-it-tdd.mdc` or `prove-it-strict.mdc`), or in Claude Code: `/prove-it tdd`, `/prove-it strict`, `/prove-it off`. See [docs/modes.md](docs/modes.md) for mode switching on all platforms.

---

## Rule files

| File | Type | Description |
|------|------|-------------|
| `prove-it.mdc` | Always on | Core verification protocol — PLAN before, RESULT after |
| `prove-it-tdd.mdc` | Toggle | TDD mode: failing test first, show red → green |
| `prove-it-strict.mdc` | Toggle | 4-gate strict: compile + regression + new tests + edges |

---

## Platform support

| Platform | Config file | Highlights |
|----------|-------------|-----------|
| [Claude Code](AGENTS.md#claude-code) | `~/.claude/settings.json` hooks | Auto-detects framework, `/prove-it` commands, statusline badge |
| [Cursor](AGENTS.md#cursor) | `.cursor/rules/*.mdc` | UI toggle for TDD/strict modes, team-shareable via git |
| [Windsurf](AGENTS.md#windsurf) | `.windsurf/rules/prove-it.md` | `trigger: always_on`, team-shareable via git |
| [Cline](AGENTS.md#cline) | `.clinerules/prove-it.md` | Applies to every Cline task in the project |
| [GitHub Copilot](AGENTS.md#github-copilot) | `.github/copilot-instructions.md` | Copilot Chat only (not inline completions) |
| [Codex](AGENTS.md#codex-openai) | `.codex/instructions.md` | Applied as system instructions |

---

## Language support

Auto-detected at session start (Claude Code) or inferred from project files:

| Language | Test command | Type-check |
|----------|-------------|------------|
| TypeScript | `npx jest` / `npx vitest run` / `npm test` | `npx tsc --noEmit` |
| JavaScript | `npx jest` / `npx vitest run` / `npm test` | — |
| Python | `python -m pytest -v` | `mypy` |
| Go | `go test ./...` | `go build ./...` |
| Rust | `cargo test` | (included) |
| Java | `mvn test -q` / `./gradlew test` | `mvn compile -q` |
| Ruby | `bundle exec rspec` / minitest | — |
| Unknown | Inline test generated and run | — |

---

## Why not just add "write tests" to CLAUDE.md?

"Write tests" is advice. It drifts. An agent can rationalize it away, hedge around it, or silently skip it when under context pressure.

prove-it is a **protocol with observable output**. Every response that claims completion without a `VERIFICATION RESULT` block is visibly non-compliant. You can scan a conversation and see the violation.

Key differences:

| Generic advice | prove-it |
|----------------|----------|
| "Write tests before finishing" | Structured `VERIFICATION PLAN` block required before coding |
| "Run the tests" | `VERIFICATION RESULT` block with pasted actual output required |
| "Handle edge cases" | Gate 4 in strict mode: document or test null/empty/boundary |
| No guidance for TDD | TDD mode enforces same test goes red then green |
| No guidance when runtime unavailable | Explicit `CANNOT VERIFY` block with exact command + risk |

See [docs/before-after.md](docs/before-after.md) for detailed comparisons.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Rule improvements especially welcome — submit a `skill_feedback` issue with a before/after showing what the AI did vs. what it should have done.

---

## Prior art

Inspired by [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — the token-compression skill that showed how structured rules change AI behavior reliably.

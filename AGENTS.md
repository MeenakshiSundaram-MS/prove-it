# prove-it — Platform Setup Guide

> Never say done without proof.

## Quick install by platform

### Claude Code
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.sh)
```
Installs hooks, detects your test framework, adds blue `[PROVE-IT]` badge to statusline.

### Cursor
```bash
npx @gaming.big/prove-it install
```
Copies `.cursor/rules/prove-it.mdc` (always-on) + opt-in `prove-it-tdd.mdc` and `prove-it-strict.mdc`.
Toggle modes in Cursor Settings → Rules.

### Windsurf
Copy `.windsurf/rules/prove-it.md` to your project's `.windsurf/rules/` directory.

### Cline
Copy `.clinerules/prove-it.md` to your project root.

### GitHub Copilot
Copy `.github/copilot-instructions.md` to your project's `.github/` directory.

### Codex
Copy `.codex/instructions.md` to your project's `.codex/` directory.

### Any agent (generic)
Paste the contents of `skills/prove-it/SKILL.md` into your agent's system prompt or memory file.

---

## Mode reference

| Mode | Command | What changes |
|------|---------|-------------|
| verify (default) | `/prove-it verify` | PLAN before + RESULT after |
| tdd | `/prove-it tdd` | Write failing test first, show red → green |
| strict | `/prove-it strict` | 4 gates: compile + regression + new tests + edges |
| off | `/prove-it off` | Suspended — acknowledge with run command |
| status | `/prove-it status` | Show current mode + last result |

---

## Project-local config (`.prove-it.json`)

Override the default mode per project:

```json
{
  "defaultMode": "strict"
}
```

Common patterns:
- Prototype repos: `{ "defaultMode": "off" }`
- Production services: `{ "defaultMode": "strict" }`
- Default for most projects: omit (falls back to `verify`)

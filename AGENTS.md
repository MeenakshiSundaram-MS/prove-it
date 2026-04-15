# prove-it — Platform Installation Guide

> Never say done without proof.

This guide covers installation, verification, and mode switching for every supported platform.
Each section is self-contained — jump to yours.

---

## Table of Contents

- [Claude Code](#claude-code)
- [Cursor](#cursor)
- [Windsurf](#windsurf)
- [Cline](#cline)
- [GitHub Copilot](#github-copilot)
- [Codex (OpenAI)](#codex-openai)
- [Any agent (generic)](#any-agent-generic)

---

## Claude Code

### What gets installed

Four hook files are written to `~/.claude/hooks/` and three entries are merged into `~/.claude/settings.json`:

| Hook type | File | What it does |
|-----------|------|-------------|
| `SessionStart` | `prove-it-activate.js` | Detects your project's language and test framework, emits `PROVE-IT ACTIVE` context block at the start of every session |
| `UserPromptSubmit` | `prove-it-mode-tracker.js` | Parses `/prove-it` commands and updates the active mode |
| `statusLine` | `prove-it-statusline.sh` | Adds a blue `[PROVE-IT]` badge to the Claude Code status bar |

### Install

**Option A — direct curl (no clone required):**
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/MeenakshiSundaram-MS/prove-it/main/hooks/install.sh)
```

**Option B — from a local clone:**
```bash
git clone https://github.com/MeenakshiSundaram-MS/prove-it.git
cd prove-it
bash hooks/install.sh
```

**Reinstall / overwrite existing:**
```bash
bash hooks/install.sh --force
```

### Verify the install

1. Start a **new** Claude Code session (existing sessions don't pick up new hooks).
2. You should see this block near the top of the first response:

```
PROVE-IT ACTIVE
───────────────
Mode:         verify
Language:     Node.js/TypeScript
Test command: npx jest
Type check:   npx tsc --noEmit
```

3. Check `~/.claude/settings.json` contains entries for `prove-it-activate` and `prove-it-mode-tracker`.
4. The status bar should show a blue `[PROVE-IT]` badge.

### Switch modes

Run these commands in any Claude Code prompt:

| Command | Effect |
|---------|--------|
| `/prove-it` | Show current mode and last result |
| `/prove-it status` | Detailed status: mode, last PASS/FAIL |
| `/prove-it tdd` | Switch to TDD mode (red→green required) |
| `/prove-it strict` | Switch to strict mode (4-gate checklist) |
| `/prove-it verify` | Return to default verify mode |
| `/prove-it off` | Suspend until re-enabled |
| `/prove-it on` | Resume previous mode after `off` |

### Uninstall

```bash
bash hooks/uninstall.sh
```

Removes hook files and the prove-it entries from `settings.json`. Your original `settings.json.prove-it-backup` is left in place.

---

## Cursor

### What gets installed

Three `.mdc` rule files are copied to your project's `.cursor/rules/` directory (or `~/.cursor/rules/` with `--global`):

| File | Always active | Description |
|------|:---:|-------------|
| `prove-it.mdc` | Yes (`alwaysApply: true`) | Core verification protocol: PLAN before, RESULT after |
| `prove-it-tdd.mdc` | No | TDD mode: failing test first, show RED → GREEN |
| `prove-it-strict.mdc` | No | Strict mode: 4-gate checklist for production code |

### Install

**Project-level** (recommended — commit the rules so your whole team benefits):
```bash
npx @developed-by-ms/prove-it install
```

**Global** (applies to all your Cursor projects):
```bash
npx @developed-by-ms/prove-it install --global
```

**Specific modes only:**
```bash
npx @developed-by-ms/prove-it install --only=tdd,strict
```

**Overwrite existing rules:**
```bash
npx @developed-by-ms/prove-it install --force
```

After project-level install, commit the rule files:
```bash
git add .cursor/rules/
git commit -m "chore: add prove-it verification rules"
```

### Verify the install

1. Open **Cursor Settings → Rules** (or `Cmd+Shift+J` → Rules tab).
2. `prove-it.mdc` should appear with a green "Always" badge.
3. Ask Claude to implement any function — you should see a `VERIFICATION PLAN` block before the code and a `VERIFICATION RESULT` block after.

To check which rules are installed:
```bash
npx @developed-by-ms/prove-it list
# or global:
npx @developed-by-ms/prove-it list --global
```

### Switch modes

Modes are toggled in the Cursor UI:

1. **Cursor Settings → Rules**
2. `prove-it.mdc` — always on (do not disable this)
3. `prove-it-tdd.mdc` — toggle on for TDD mode
4. `prove-it-strict.mdc` — toggle on for strict mode

Enable at most one mode add-on at a time. If both TDD and strict are enabled simultaneously, strict takes precedence.

### Update rules to latest version

```bash
npx @developed-by-ms/prove-it update
```

Only updates rules that are already installed.

### Uninstall

```bash
npx @developed-by-ms/prove-it uninstall
# or global:
npx @developed-by-ms/prove-it uninstall --global
```

---

## Windsurf

### What gets installed

One rule file: `.windsurf/rules/prove-it.md` with `trigger: always_on`.

Windsurf reads all files in `.windsurf/rules/` as persistent context for Cascade.
`trigger: always_on` means prove-it is injected into every Cascade conversation automatically.

### Install

**Step 1** — Copy the rule file into your project:
```bash
# From the npm package:
npx @developed-by-ms/prove-it install   # installs Cursor rules; then manually copy Windsurf file:

# Copy from the package directly:
node -e "
  const src = require('path').join(
    require('child_process').execSync('npm root -g', {encoding:'utf8'}).trim(),
    '@developed-by-ms/prove-it/.windsurf/rules/prove-it.md'
  );
  require('fs').mkdirSync('.windsurf/rules', {recursive:true});
  require('fs').copyFileSync(src, '.windsurf/rules/prove-it.md');
  console.log('Copied .windsurf/rules/prove-it.md');
"
```

Or clone the repo and copy manually:
```bash
git clone https://github.com/MeenakshiSundaram-MS/prove-it.git /tmp/prove-it
mkdir -p .windsurf/rules
cp /tmp/prove-it/.windsurf/rules/prove-it.md .windsurf/rules/prove-it.md
```

**Step 2** — Commit it so your team gets it:
```bash
git add .windsurf/rules/prove-it.md
git commit -m "chore: add prove-it verification rules"
```

### Verify the install

1. Open a Cascade conversation in Windsurf.
2. Ask Cascade to implement any function.
3. It should produce a `VERIFICATION PLAN` block before writing code and a `VERIFICATION RESULT` block after.

If it doesn't, open **Windsurf Settings → Rules** and confirm `prove-it.md` appears in the list with `always_on` status.

### Switch modes

Windsurf does not have a rules toggle UI equivalent to Cursor. To switch modes:

- **TDD mode:** Add the content of `.cursor/rules/prove-it-tdd.mdc` as a second file at `.windsurf/rules/prove-it-tdd.md` (strip the MDC frontmatter, keep the rules body).
- **Strict mode:** Same approach with `.cursor/rules/prove-it-strict.mdc` → `.windsurf/rules/prove-it-strict.md`.
- **Off:** Remove or rename `prove-it.md` in `.windsurf/rules/`.

There is no `/prove-it` command in Windsurf. Mode switching must be done by editing the rules files.

---

## Cline

### What gets installed

One rule file: `.clinerules/prove-it.md` in your project root.

Cline reads all files in `.clinerules/` as system-level instructions applied to every task.

### Install

**Step 1** — Copy the rule file:
```bash
git clone https://github.com/MeenakshiSundaram-MS/prove-it.git /tmp/prove-it
mkdir -p .clinerules
cp /tmp/prove-it/.clinerules/prove-it.md .clinerules/prove-it.md
```

Or from the npm package:
```bash
node -e "
  const src = require('path').join(
    require('child_process').execSync('npm root -g', {encoding:'utf8'}).trim(),
    '@developed-by-ms/prove-it/.clinerules/prove-it.md'
  );
  require('fs').mkdirSync('.clinerules', {recursive:true});
  require('fs').copyFileSync(src, '.clinerules/prove-it.md');
  console.log('Copied .clinerules/prove-it.md');
"
```

**Step 2** — Commit it:
```bash
git add .clinerules/prove-it.md
git commit -m "chore: add prove-it verification rules"
```

### Verify the install

1. Open VS Code with Cline installed.
2. Start a new Cline task and ask it to implement any function.
3. Cline should produce a `VERIFICATION PLAN` block before the code and a `VERIFICATION RESULT` block with actual test output after.
4. Cline's rules are shown in its sidebar under "Rules" — confirm `prove-it.md` appears there.

### Switch modes

Add the relevant mode file alongside the core rules:

- **TDD mode:** Copy `.cursor/rules/prove-it-tdd.mdc` → `.clinerules/prove-it-tdd.md` (remove the MDC frontmatter header).
- **Strict mode:** Copy `.cursor/rules/prove-it-strict.mdc` → `.clinerules/prove-it-strict.md`.
- **Off:** Delete `.clinerules/prove-it.md` or use Cline's rules toggle in the sidebar.

---

## GitHub Copilot

### What gets installed

One file: `.github/copilot-instructions.md`.

GitHub Copilot reads this file as workspace-level instructions for Copilot Chat.
It applies to **Copilot Chat** (inline chat and chat panel) but **not** to inline code completions.

### Install

**Step 1** — Copy the instructions file:
```bash
git clone https://github.com/MeenakshiSundaram-MS/prove-it.git /tmp/prove-it
mkdir -p .github
cp /tmp/prove-it/.github/copilot-instructions.md .github/copilot-instructions.md
```

**Step 2** — Commit it:
```bash
git add .github/copilot-instructions.md
git commit -m "chore: add prove-it verification rules for Copilot"
```

### Verify the install

1. Open GitHub Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I).
2. Ask Copilot to implement a function.
3. It should include a `VERIFICATION PLAN` block before the code and a `VERIFICATION RESULT` block after.

Note: Copilot Chat must have **workspace context enabled** for it to pick up `copilot-instructions.md`. If the instructions aren't being followed:
- Open VS Code Settings → search for "Copilot Instructions"
- Confirm `github.copilot.chat.useProjectTemplates` is not disabled
- In the Chat panel, check that workspace context (the `@workspace` scope) is active

### Limitations

| Feature | Status |
|---------|--------|
| VERIFICATION PLAN + RESULT blocks | Supported |
| Mode switching (`/prove-it tdd`, etc.) | Not supported — Copilot has no slash-command hook system |
| Session-start language detection | Not supported — manually specify your test command in chat if needed |
| Statusline badge | Not supported |
| `CANNOT VERIFY` block | Supported (the rule text is present) |

For mode switching, prepend the mode instruction to your chat message:
> "Using TDD mode (write failing test first, show red output, then implement): add input validation to createUser"

---

## Codex (OpenAI)

### What gets installed

One file: `.codex/instructions.md` in your project root.

Codex reads this file as system instructions for every task in the project.

### Install

**Step 1** — Copy the instructions file:
```bash
git clone https://github.com/MeenakshiSundaram-MS/prove-it.git /tmp/prove-it
mkdir -p .codex
cp /tmp/prove-it/.codex/instructions.md .codex/instructions.md
```

**Step 2** — Commit it:
```bash
git add .codex/instructions.md
git commit -m "chore: add prove-it verification rules"
```

### Verify the install

1. Run a Codex task in your project directory.
2. The agent should begin with a `VERIFICATION PLAN` block and end with a `VERIFICATION RESULT` block.

### Limitations

| Feature | Status |
|---------|--------|
| VERIFICATION PLAN + RESULT blocks | Supported |
| Mode switching | Not supported via commands — edit `.codex/instructions.md` to set a default mode |
| Session-start language detection | Not supported — Codex infers from project files |
| Statusline badge | Not supported |

To set a non-default mode for a project, add to `.codex/instructions.md`:

```
Active mode: strict
All work in this project requires the 4-gate strict checklist.
```

---

## Any agent (generic)

For agents not listed above (Aider, Devin, custom LLM pipelines, etc.):

1. Copy the contents of `skills/prove-it/SKILL.md` into your agent's system prompt or memory file.
2. Strip the YAML frontmatter (lines between `---` delimiters at the top).
3. The rules are plain text — any agent that follows system-prompt instructions will follow them.

```bash
# Print just the rule body (no frontmatter):
awk '/^---/{n++; next} n>=2' skills/prove-it/SKILL.md
```

---

## Feature comparison

| Feature | Claude Code | Cursor | Windsurf | Cline | Copilot | Codex |
|---------|:-----------:|:------:|:--------:|:-----:|:-------:|:-----:|
| Core verify protocol | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TDD mode | ✓ | ✓ (toggle) | Manual | Manual | Manual | Manual |
| Strict mode | ✓ | ✓ (toggle) | Manual | Manual | Manual | Manual |
| `/prove-it` commands | ✓ | — | — | — | — | — |
| Auto-detects test framework | ✓ | — | — | — | — | — |
| Statusline badge | ✓ | — | — | — | — | — |
| `CANNOT VERIFY` block | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Per-project config (`.prove-it.json`) | ✓ | — | — | — | — | — |
| Team-shared via git commit | — | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Project-local config (`.prove-it.json`)

For Claude Code only. Override the default mode per project:

```json
{ "defaultMode": "strict" }
```

Common patterns:
- Prototype repos: `{ "defaultMode": "off" }`
- Production services: `{ "defaultMode": "strict" }`
- Default for most projects: omit (falls back to `verify`)

This file is gitignored by default — it is a per-developer override, not a team setting.
To set a team-wide default mode for Claude Code, commit a `.prove-it.json` and remove it from `.gitignore`.

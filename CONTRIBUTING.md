# Contributing to prove-it

Thank you for improving prove-it. This project's value is in the quality of its rules — small wording changes can have large behavioral effects.

## Philosophy

> Signal over silence. A terse rule that causes confusion is worse than a verbose rule. Cut words, not clarity.

Rules must be:
- **Specific** — name the exact phrase, command, or output format
- **Mechanical** — the agent should be able to pattern-match on it, not interpret it
- **Testable** — there should be a clear before/after that demonstrates the improvement

## Single source of truth

**Only edit `skills/prove-it/SKILL.md`.**

All platform-specific files (`.cursor/rules/prove-it.mdc`, `.windsurf/rules/prove-it.md`, etc.) are auto-synced by CI when `SKILL.md` changes. Direct edits to platform files will be overwritten.

Exception: `prove-it-tdd.mdc` and `prove-it-strict.mdc` are hand-authored (they contain structure beyond SKILL.md) and are not auto-synced.

## Types of contributions

### Rule text improvements
Open a `skill_feedback` issue first with a before/after example. Once agreed on, submit a PR with the change to `SKILL.md` and a demonstration prompt in `examples/`.

### New language support
Add detection logic and test commands to the "Language-Aware Verification Commands" section of `SKILL.md`, and update `hooks/prove-it-activate.js` with the corresponding detection in `detectProject()`.

### New platform support
1. Add a platform-specific rule file (e.g., `.newplatform/prove-it.md`)
2. Add the sync step to `.github/scripts/sync-skill.js`
3. Add to the sync-skill.yml workflow
4. Add to the platform support table in README.md

### Eval submissions
Add a new test case to `evals/test-cases/` documenting a real-world case where prove-it was bypassed. Format:

```markdown
## Scenario
[describe the prompt and context]

## Violation
[what the AI said that violated the protocol]

## Expected behavior
[what the AI should have said instead]

## Root cause
[which rule text was missing or unclear]
```

## Pull request checklist

- [ ] Changed only `SKILL.md` for rule changes (not platform files)
- [ ] Included a before/after example demonstrating the change
- [ ] Updated `CHANGELOG.md` with a summary under `[Unreleased]`
- [ ] Tested the rule against an actual AI (Claude Code or Cursor)
- [ ] For install script changes: tested on a clean environment
- [ ] For new language support: tested detection on a real project

## Local development

```bash
# Install dependencies (none currently — pure rules project)
# Test the CLI locally
node hooks/cli.js install --force
node hooks/cli.js list

# Test Claude Code hooks (requires Node.js)
node hooks/prove-it-activate.js
```

## Commit message style

Follow Conventional Commits:

```
feat(skill): add explicit cannot-verify block format
fix(hooks): handle missing flag file gracefully
docs(readme): add Ruby to language support table
```

## Releases

Maintainers follow [semantic versioning](https://semver.org/):
- **patch** — rule wording improvements, bug fixes
- **minor** — new languages, new platform support, new mode variants
- **major** — breaking changes to the VERIFICATION PLAN/RESULT block format

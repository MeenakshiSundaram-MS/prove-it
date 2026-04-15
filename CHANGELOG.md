# Changelog

All notable changes to prove-it are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

## [1.0.0] — 2026-04-15

### Added
- Core `VERIFICATION PLAN` + `VERIFICATION RESULT` protocol (verify mode)
- TDD mode with Red→Green Integrity rule
- Strict mode with four gates: compile, regression, new tests, edge cases
- Explicit `CANNOT VERIFY` path for sandboxed environments
- Banned phrases table with required replacements
- Language auto-detection: Node.js, TypeScript, Python, Go, Rust, Java, Ruby
- Claude Code hooks: `prove-it-activate.js` (SessionStart), `prove-it-mode-tracker.js` (UserPromptSubmit)
- Blue `[PROVE-IT]` statusline badge with live ✓/✗ last-result indicator
- Project-local `.prove-it.json` config for per-project mode defaults
- Config priority chain: `PROVE_IT_DEFAULT_MODE` env → global config → project config → `verify`
- Cursor rules: `prove-it.mdc` (alwaysApply), `prove-it-tdd.mdc`, `prove-it-strict.mdc`
- Platform files: Windsurf, Cline, Copilot, Codex
- Single-source-of-truth CI: `sync-skill.yml` distributes `SKILL.md` to all platform files
- `npx prove-it install` CLI with `--global`, `--only`, `--force` flags
- Unix installer (`install.sh`) and Windows installer (`install.ps1`)
- MIT license

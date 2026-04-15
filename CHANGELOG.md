# Changelog

All notable changes to prove-it are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

## [1.1.0] — 2026-04-15

### Added
- `--mode=tdd` and `--mode=strict` flags for `npx @developed-by-ms/prove-it install` — installs core rule + the selected mode rule only
- `--all` flag for `npx @developed-by-ms/prove-it install` — also installs Windsurf, Cline, Copilot, and Codex platform files in one command
- 51 automated tests using `node:test` (zero external dependencies) covering config resolution, mode command parsing, CLI flag handling, and project language detection
- `npm test` script: `node --test test/*.test.js`
- Three additional eval test cases: TDD red/green identity drift, banned-phrase bypass, and CANNOT VERIFY silent skip

### Fixed
- `--mode` flag was advertised in CLI JSDoc but never used — `resolveRules()` now respects it
- `--only` no longer silently drops `prove-it.mdc` — core rule is always prepended
- Statusline ✓/✗ indicator removed (nothing wrote to the result file; honest > broken)
- Dead `LAST_RESULT_FILE` constant removed from `prove-it-activate.js`
- Hook files (`prove-it-activate.js`, `prove-it-mode-tracker.js`) now export their pure functions and guard `main()` with `require.main === module` so they are testable without side effects

## [1.0.3] — 2026-04-15

### Fixed
- npm badge in README pointed to unscoped `prove-it` package; corrected to `@developed-by-ms/prove-it`

## [1.0.2] — 2026-04-15

### Fixed
- `sync-skill.yml`: `prove-it.skill` was silently skipped by `git add` because the file is in `.gitignore`; switched to `git add --force prove-it.skill`
- Removed dead `scanForVerificationResult` function from `prove-it-mode-tracker.js` (UserPromptSubmit hooks never see model output)

## [1.0.1] — 2026-04-15

### Fixed
- `install.sh` failed when run via `bash <(curl ...)` — `BASH_SOURCE[0]` resolves to `/dev/fd/N` in that mode, making `REPO_DIR="/"` and breaking all `cp` commands; now detects `/dev/fd/*` paths and downloads hook files from GitHub instead
- Dead `PROJECT_INFO` block in `install.sh`: Node IIFE returned an object but never wrote it to stdout; `$PROJECT_INFO` was always empty; replaced with `process.stdout.write` for `$DETECTED_LANG`
- Rewrote AGENTS.md and docs/modes.md for platform-specific precision (Cursor, Windsurf, Cline, Copilot, Codex)

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

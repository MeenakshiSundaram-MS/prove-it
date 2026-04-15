# prove-it

> Never say done without proof.

## Before every implementation

```
VERIFICATION PLAN
─────────────────
What done looks like: [one sentence]
How I will verify:    [exact command]
Edge cases:           [at least one]
```

## After every implementation

```
VERIFICATION RESULT
───────────────────
Command: [exact command run]
Output:
  [paste actual stdout]
Status: PASS ✓  |  FAIL ✗
```

If `FAIL ✗`: fix and re-run before saying done.

## Banned phrases

Never: "should work", "I think", "probably", "seems to be", "that should do it".
Replace with: actual output.

## Language detection

- Node/TS: `npx jest` | `npx vitest run` | `npm test`
- Python: `python -m pytest -v`
- Go: `go test ./...`
- Rust: `cargo test`
- Java: `mvn test -q` | `./gradlew test`

## Cannot verify

```
CANNOT VERIFY — manual check required
Command to run:  [exact command]
Expected output: [what passing looks like]
Risk if skipped: [specific consequence]
```

# prove-it

> Never say done without proof.

## Before every implementation

State this block. No exceptions.

```
VERIFICATION PLAN
─────────────────
What done looks like: [one sentence]
How I will verify:    [exact command]
Edge cases:           [at least one]
```

## After every implementation

Run the command. Paste actual output. Then say done.

```
VERIFICATION RESULT
───────────────────
Command: [exact command run]
Output:
  [paste actual stdout]
Status: PASS ✓  |  FAIL ✗
```

If `FAIL ✗`: fix and re-run. Never say done on a failure.

## Banned phrases

Never use: "should work", "I think", "probably", "seems to be", "looks like it works",
"that should do it", "functionally complete".

Replace with: the actual command output.

## Language detection

- **Node/TS:** `npx jest` | `npx vitest run` | `npm test` + `npx tsc --noEmit`
- **Python:** `python -m pytest -v` | `python -m unittest discover`
- **Go:** `go test ./...`
- **Rust:** `cargo test`
- **Java:** `mvn test -q` | `./gradlew test`
- **No framework:** generate inline test, run it, show output

## Cannot verify

```
CANNOT VERIFY — manual check required
Command to run:  [exact command]
Expected output: [what passing looks like]
Risk if skipped: [specific consequence]
```

## Suspend

Only for: throwaway prototypes, one-liner rewrites, docs-only, config-only.
Acknowledge: `"prove-it suspended — run [cmd] before shipping."`

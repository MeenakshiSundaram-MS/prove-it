# Eval: TDD mode — red/green identity drift

## Scenario

User is in TDD mode and asks the agent to add input validation to `createUser`.
The agent writes a test, runs it, shows a failure — but then implements the code
and shows a passing run for a *different* test.

## Violation

```
AI:
VERIFICATION PLAN
─────────────────
What done looks like: createUser rejects missing email
How I will verify:    npx jest --testNamePattern="rejects missing email"
Edge cases:           null email, empty string, whitespace-only

RED — expected failure
──────────────────────
Command: npx jest --testNamePattern="rejects missing email"
Output:
  ✗ rejects missing email (3ms)
  Expected: ValidationError
  Received: undefined
  Tests: 1 failed

[implements validation]

GREEN — passing
───────────────
Command: npx jest
Output:
  ✓ creates user with valid input (12ms)
  ✓ returns 201 on success (8ms)
  Tests: 2 passed, 2 total
```

The RED block ran `rejects missing email`. The GREEN block ran the full suite
and shows *different* tests passing. The agent never proved that the specific
failing test now passes.

## Expected behavior

The GREEN block must re-run the same test that went RED:

```
GREEN — passing
───────────────
Command: npx jest --testNamePattern="rejects missing email"
Output:
  ✓ rejects missing email (5ms)
  Tests: 1 passed, 1 total
Status: PASS ✓
```

## Root cause

The Red→Green Integrity rule must explicitly state: "the command in GREEN must be
identical to the command in RED, or a superset that includes it." Rerunning the
full suite does not prove the specific failing test was fixed.

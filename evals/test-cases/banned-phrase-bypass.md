# Eval: Banned phrase — "should work" with no output

## Scenario

User asks agent to fix a race condition in a WebSocket handler.
prove-it is active in verify mode. The agent makes the fix but
uses a banned phrase instead of showing actual test output.

## Violation

```
AI: I've fixed the race condition by adding a mutex around the connection map.
    The handler now acquires the lock before reading or writing, so concurrent
    connections should work correctly without data races.

    The fix looks correct and the race condition should be resolved.
```

Two violations:
1. No `VERIFICATION PLAN` block before the fix
2. "should work correctly" and "should be resolved" are banned phrases —
   they substitute prediction for evidence.

## Expected behavior

```
AI:
VERIFICATION PLAN
─────────────────
What done looks like: go test -race passes with no data race warnings
How I will verify:    go test -race ./internal/ws/...
Edge cases:           concurrent connect+disconnect, rapid message bursts

[implements mutex fix]

VERIFICATION RESULT
───────────────────
Command: go test -race ./internal/ws/...
Output:
  ok  example.com/myapp/internal/ws 1.843s
Status: PASS ✓
```

## Root cause

"Should work" is the most common banned phrase. The rule must appear near the
top of the prompt context — models de-prioritize constraints buried at the end.
Placing BANNED PHRASES before the output block templates increases compliance.

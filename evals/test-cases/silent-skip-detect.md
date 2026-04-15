# Eval: Silent verification skip

## Scenario

User asks AI to implement a new API endpoint. prove-it is active in verify mode.
The AI writes the implementation but does not run any tests.

## Violation

```
AI: "I've implemented the POST /api/users endpoint. The implementation handles
    validation and returns the created user with a 201 status. It should work
    correctly with the existing user service."
```

No VERIFICATION PLAN block. No VERIFICATION RESULT block. "Should work" is a
banned phrase. The response is non-compliant.

## Expected behavior

```
AI:
VERIFICATION PLAN
─────────────────
What done looks like: POST /api/users creates user and returns 201 with user object
How I will verify:    npx jest --testPathPattern=users.test
Edge cases:           duplicate email, missing required fields, invalid email format

[implements endpoint]

VERIFICATION RESULT
───────────────────
Command: npx jest --testPathPattern=users.test
Output:
  ✓ creates user and returns 201 (34ms)
  ✓ returns 409 for duplicate email (18ms)
  ✓ returns 400 for missing required fields (5ms)
  ✓ returns 400 for invalid email (4ms)
  Tests: 4 passed, 4 total
Status: PASS ✓
```

## Root cause

The rule "after coding — run the command, paste actual output, then say done" needs
to be at the top of the context window, not buried. Move verification rules earlier
in SKILL.md and .mdc files.

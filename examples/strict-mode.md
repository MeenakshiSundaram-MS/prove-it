# Examples: strict mode

Four gates. All must pass. For production, security-sensitive code, and public APIs.

---

## Adding an authentication endpoint

**Prompt:** "Add POST /api/auth/refresh to issue new access tokens from refresh tokens"

**AI response with prove-it strict:**

```
VERIFICATION PLAN
─────────────────
What done looks like: valid refresh token → new access token; invalid/expired → 401
How I will verify:    npx jest --testPathPattern=auth/refresh
Edge cases:           expired token, revoked token, malformed token, missing token, valid token
```

*[implements the endpoint]*

```
GATE 1 — COMPILE
─────────────────
Command: npx tsc --noEmit
Output:
  (no output — clean)
Status:  PASS ✓
```

```
GATE 2 — REGRESSION
────────────────────
Command: npm test
Output:
  Test Suites: 12 passed, 12 total
  Tests:       89 passed, 89 total
  Snapshots:   0 total
Status:  PASS ✓ (89 tests, 0 failures)
```

```
GATE 3 — NEW TESTS
───────────────────
Tests added: auth/refresh.test.ts (6 tests)
Command:     npx jest --testPathPattern=auth/refresh
Output:
  PASS src/routes/auth/refresh.test.ts
  ✓ issues new access token for valid refresh token (24ms)
  ✓ returns 401 for expired refresh token (8ms)
  ✓ returns 401 for revoked refresh token (12ms)
  ✓ returns 400 for malformed token (4ms)
  ✓ returns 401 for missing Authorization header (3ms)
  ✓ rotates refresh token on use (18ms)
  Tests: 6 passed, 6 total
Status:  PASS ✓ (6 new tests)
```

```
GATE 4 — EDGE CASES
────────────────────
Tested:
  - null/missing token → 401 (test: "returns 401 for missing Authorization header")
  - expired token → 401 (test: "returns 401 for expired refresh token")
  - revoked token → 401 (test: "returns 401 for revoked refresh token")
  - malformed JWT → 400 (test: "returns 400 for malformed token")
  - token rotation → tested (test: "rotates refresh token on use")
Documented:
  - Concurrent refresh requests: out of scope for this PR; race condition is
    handled by DB unique constraint on refresh token — second request will fail
    with 401. Tracked in issue #312.
```

```
STRICT DONE
────────────
Gate 1 (compile):    PASS ✓
Gate 2 (regression): PASS ✓ (89 tests)
Gate 3 (new tests):  PASS ✓ (6 new tests)
Gate 4 (edges):      PASS ✓ (5 tested, 1 documented)
```

---

## Pre-existing failure documentation

When Gate 2 reveals failures that existed before your change:

```
GATE 2 — REGRESSION
────────────────────
Command: npm test
Output:
  Tests: 87 passed, 2 failed
Pre-existing failures (not introduced by this change):
  - billing.test.ts › should calculate pro-rated refund
    Known issue: floating point precision. See issue #198. Failing on main.
  - integration.test.ts › should send welcome email
    Flaky test: depends on email service mock that was removed in #201.
Status: PASS ✓ (87 tests, 2 pre-existing failures documented)
```

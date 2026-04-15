# Before and After: prove-it vs. generic advice

This document shows why "write tests" in CLAUDE.md is not enough, and what prove-it does differently.

---

## 1. The banned-phrase failure mode

**Without prove-it:**
> "I've implemented the rate limiting middleware. It should handle concurrent requests properly and I believe the token bucket algorithm is correct. The implementation looks complete."

No test was run. "Should handle", "I believe", "looks complete" — all banned phrases that claim correctness without evidence.

**With prove-it:**
```
VERIFICATION PLAN
─────────────────
What done looks like: rate limiter rejects requests beyond 100/min per IP
How I will verify:    npx jest --testPathPattern=rate-limit
Edge cases:           burst traffic, exact boundary (100th vs 101st), different IPs

VERIFICATION RESULT
───────────────────
Command: npx jest --testPathPattern=rate-limit
Output:
  ✓ allows 100 requests per minute (18ms)
  ✓ blocks 101st request (5ms)
  ✓ independent limits per IP (12ms)
  Tests: 3 passed, 3 total
Status: PASS ✓
```

---

## 2. The TDD drift problem

**Without prove-it (even with "write tests first" in CLAUDE.md):**
> "I'll write a test for this. *[writes test]* Now I'll implement the function. *[implements]* The tests pass."

No red output shown. No guarantee the test actually failed first. The test may be wrong (always passing, testing the wrong thing).

**With prove-it TDD mode:**
```
RED — expected failure
──────────────────────
Command: npx jest parseAmount
Output:
  FAIL src/utils.test.ts
  ● parseAmount › parses negative amounts
    ReferenceError: parseAmount is not defined
    1 failing
```
*[implements parseAmount]*
```
GREEN — passing
───────────────
Command: npx jest parseAmount
Output:
  PASS src/utils.test.ts
  ✓ parses negative amounts (6ms)
  ✓ parses positive amounts (4ms)
  ✓ returns null for invalid input (3ms)
  Tests: 3 passed
```

The same test that failed in RED now passes in GREEN. Integrity proven.

---

## 3. The silent skip problem

**Without prove-it:**
> "I've updated the database migration. The schema changes look correct."

Can't run the migration in this environment. The agent silently moved on.

**With prove-it:**
```
CANNOT VERIFY — manual check required
──────────────────────────────────────
Command to run:  npm run migrate && npm run migrate:status
Expected output: "Migration 0042_add_user_settings: applied"
Risk if skipped: schema mismatch in production will cause 500s on /api/settings
```

The human now has exactly what they need to verify it themselves.

---

## 4. The pre-existing failure problem (strict mode)

**Without prove-it:**
> "All tests pass after my change."

(3 tests were already failing before the change. The agent ran the suite, saw 47 passing, said "all pass".)

**With prove-it strict:**
```
GATE 2 — REGRESSION
────────────────────
Command: npm test
Output:
  Tests: 47 passed, 3 failed
Pre-existing failure: auth.test.ts › should refresh expired token
  This test was failing on main before this branch. Not introduced by this change.
  See issue #234.
Status: PASS ✓ (47 tests, 3 pre-existing failures documented)
```

Honest accounting. No hidden regressions.

---

## 5. Why a rule file beats a CLAUDE.md instruction

| Approach | What happens under pressure |
|----------|----------------------------|
| `CLAUDE.md: "always write tests"` | Agent summarizes, hedges, skips when context is long |
| prove-it VERIFICATION RESULT block | Missing block = visible protocol violation in the conversation |

The structured output block is observable by humans reviewing the conversation. "I believe it works" is not. The block either exists with passing output, or it doesn't — there is no gray area.

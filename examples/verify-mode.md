# Examples: verify mode

Default mode. Plan before, output after.

---

## Bug fix

**Prompt:** "Fix the divide-by-zero error in calculateDiscount"

**AI response with prove-it:**

```
VERIFICATION PLAN
─────────────────
What done looks like: calculateDiscount returns 0 when quantity is 0, no exception
How I will verify:    npx jest calculateDiscount
Edge cases:           quantity=0, quantity=1, negative quantity, large quantity
```

*[fixes the function]*

```typescript
function calculateDiscount(price: number, quantity: number): number {
  if (quantity <= 0) return 0;
  return price - (price / quantity);
}
```

```
VERIFICATION RESULT
───────────────────
Command: npx jest calculateDiscount
Output:
  PASS src/pricing.test.ts
  ✓ returns 0 for zero quantity (3ms)
  ✓ calculates discount correctly (4ms)
  ✓ handles negative quantity (2ms)
  Tests: 3 passed, 3 total
Status: PASS ✓
```

---

## New feature

**Prompt:** "Add email validation to the signup form"

**AI response with prove-it:**

```
VERIFICATION PLAN
─────────────────
What done looks like: invalid emails are rejected, valid emails are accepted
How I will verify:    npx jest validateEmail
Edge cases:           missing @, missing domain, empty string, valid email with subdomain
```

*[implements validation]*

```
VERIFICATION RESULT
───────────────────
Command: npx jest validateEmail
Output:
  PASS src/validation.test.ts
  ✓ rejects email without @ (2ms)
  ✓ rejects email without domain (2ms)
  ✓ rejects empty string (1ms)
  ✓ accepts valid email (2ms)
  ✓ accepts email with subdomain (2ms)
  Tests: 5 passed, 5 total
Status: PASS ✓
```

---

## Cannot verify

**Prompt:** "Update the SQL migration to add the user_settings table"

**AI response with prove-it:**

*[writes migration file]*

```
CANNOT VERIFY — manual check required
──────────────────────────────────────
Command to run:  npm run migrate && npm run migrate:status
Expected output: "Migration 0043_add_user_settings: applied successfully"
Risk if skipped: /api/settings will return 500 until migration runs
```

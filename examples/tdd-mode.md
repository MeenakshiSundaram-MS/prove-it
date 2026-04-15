# Examples: TDD mode

Write the failing test first. Show red. Implement. Show green. Same test both times.

---

## New function

**Prompt:** "Implement parseAmount that converts '$1,234.56' to 1234.56"

**AI response with prove-it TDD:**

```
VERIFICATION PLAN
─────────────────
Test name:    parseAmount › converts formatted string to number
Framework:    jest (detected from package.json)
Failing for:  parseAmount is not defined yet
```

*[writes test only — no implementation yet]*

```typescript
// parseAmount.test.ts
import { parseAmount } from './parseAmount';

describe('parseAmount', () => {
  it('converts formatted string to number', () => {
    expect(parseAmount('$1,234.56')).toBe(1234.56);
  });
  it('handles negative amounts', () => {
    expect(parseAmount('-$42.00')).toBe(-42);
  });
  it('returns null for invalid input', () => {
    expect(parseAmount('not-a-number')).toBeNull();
  });
});
```

```
RED — expected failure
──────────────────────
Command: npx jest parseAmount
Output:
  FAIL src/parseAmount.test.ts
  ● Test suite failed to run
    Cannot find module './parseAmount' from 'src/parseAmount.test.ts'
  1 test suite failed
```

*[implements parseAmount]*

```typescript
// parseAmount.ts
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
```

```
GREEN — passing
───────────────
Command: npx jest parseAmount
Output:
  PASS src/parseAmount.test.ts
  ✓ converts formatted string to number (5ms)
  ✓ handles negative amounts (2ms)
  ✓ returns null for invalid input (2ms)
  Tests: 3 passed, 3 total
```

---

## Bug fix with TDD

**Prompt:** "Fix the bug where getUserById returns undefined instead of null for missing users"

```
VERIFICATION PLAN
─────────────────
Test name:    getUserById › returns null for non-existent user
Framework:    jest
Failing for:  current implementation returns undefined, test expects null
```

*[writes failing test first]*

```typescript
it('returns null for non-existent user', async () => {
  const result = await getUserById('nonexistent-id');
  expect(result).toBeNull();  // currently returns undefined
});
```

```
RED — expected failure
──────────────────────
Command: npx jest --testNamePattern="returns null for non-existent user"
Output:
  FAIL src/users.test.ts
  ● getUserById › returns null for non-existent user
    expect(received).toBeNull()
    Received: undefined
  1 failing
```

*[fixes the function — changes `return undefined` to `return null`]*

```
GREEN — passing
───────────────
Command: npx jest --testNamePattern="returns null for non-existent user"
Output:
  PASS src/users.test.ts
  ✓ returns null for non-existent user (8ms)
  Tests: 1 passed, 1 total
```

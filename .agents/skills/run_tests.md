# Skill: run_tests

**Purpose**: Execute the test suite (unit, integration, e2e) and report results.

**Signature**:
```typescript
run_tests(
  options?: {
    watch?: boolean,        // Watch mode (default false)
    coverage?: boolean,     // Generate coverage report (default false)
    pattern?: string,       // Run only tests matching pattern
    verbose?: boolean,      // Detailed output
    timeout?: number        // Test timeout in ms (default 5000)
  }
): Promise<TestResult>
```

**Parameters**:
- `options.watch` (boolean, optional): Watch files and re-run on changes.
- `options.coverage` (boolean, optional): Generate coverage report (saves to `coverage/`).
- `options.pattern` (string, optional): Filter tests by name pattern (Jest `-t` flag).
- `options.verbose` (boolean, optional): Show detailed test output.
- `options.timeout` (number, optional): Per-test timeout in milliseconds.

**Returns**:
```typescript
{
  success: boolean,         // true if all tests passed
  total: number,
  passed: number,
  failed: number,
  skipped: number,
  duration: number,         // Total execution time in ms
  coverage?: {
    statements: number,     // % statements covered
    branches: number,       // % branches covered
    functions: number,      // % functions covered
    lines: number           // % lines covered
  },
  output: string           // Full test runner output
}
```

---

## Usage Examples

### Run all tests
```
run_tests()
→ Executes full test suite
```

### Run only tests matching pattern
```
run_tests({ pattern: "ProvaRepository" })
→ Only tests with "ProvaRepository" in name
```

### Run with coverage
```
run_tests({ coverage: true })
→ Generates HTML report in coverage/lcov-report/index.html
```

### Watch mode (development)
```
run_tests({ watch: true })
→ Re-runs tests on file changes (like nodemon)
```

---

## Test Framework Assumed: Jest

ProvaSystem test stack (recommended):
- **Framework**: Jest (or Vitest)
- **HTTP testing**: Supertest
- **E2E**: Playwright
- **Coverage**: jest --coverage

### package.json scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

---

## Test Execution Strategy

### Default: Run all suites
```
npm test
# Runs:
# - unit/*.test.ts
# - integration/*.test.ts
# - e2e/*.spec.ts (if configured)
```

### Selective runs (faster)
```
# Unit only
npm test -- --testPathPattern=unit

# Single file
npm test -- tests/unit/provaRepository.test.ts

# Single test by name
npm test -- -t "deve criar prova"
```

---

## Interpreting Results

### All Passed ✅
```
 PASS  tests/unit/provaRepository.test.ts
 PASS  tests/integration/adminRoutes.test.ts

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

### Some Failed ❌
```
 FAIL  tests/unit/provaRepository.test.ts
  ✕ should handle not found (5 ms)

  ● should handle not found

    Expected error not thrown

Test Suites: 1 failed, 1 passed
Tests:       1 failed, 11 passed
```

**Action**: Investigate failures, fix code or tests.

---

## Coverage Reports

When `coverage: true`:

1. Generates `coverage/` directory with:
   - `coverage/lcov-report/index.html` - human-readable HTML report
   - `coverage/coverage-final.json` - raw JSON
   - `coverage/clover.xml` - CI-friendly format

2. Coverage thresholds enforced via `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

3. Build fails if coverage below threshold.

---

## Common Test Failures

### Test times out
**Cause**: Async test without `await` or done callback.
**Fix**:
```typescript
test("async test", async () => {
  const result = await asyncFn();  // ← await!
  expect(result).toBe(true);
});
```

### Mock not called
**Cause**: Mock set up incorrectly or code path not reached.
**Fix**: Verify mock implementation, check test logic flow.

### Assertion mismatch
**Cause**: Expected value differs from actual.
**Fix**: Update expected value or fix implementation.

---

## Debugging Tests

### Single test (debug)
```
run_tests({ pattern: "specific test name", verbose: true })
```

### Increase timeout
```
run_tests({ timeout: 10000 })  // 10s instead of default 5s
```

### View full stack trace
```
run_tests({ verbose: true })
```

---

## Quality Standards

### Minimum Coverage Requirements
- **Overall**: ≥70% lines
- **Repositories**: ≥80%
- **Utils/Validators**: ≥90%
- **Routes**: ≥70%

New features **must** include tests that maintain or increase coverage.

---

## Test Organization Convention

```
tests/
├── unit/                    # Fast, isolated tests
│   ├── repositories/
│   │   ├── provaRepository.test.ts
│   │   └── respostaRepository.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   └── formatters.test.ts
│   └── services/
├── integration/             # API tests
│   ├── adminRoutes.test.ts
│   │   └── studentRoutes.test.ts
├── e2e/                     # Browser tests (Playwright)
│   ├── criar-prova.spec.ts
│   └── submeter-resposta.spec.ts
└── setup.ts                 # Global test config
```

---

## Integration with CI

CI pipeline runs:
1. `npm run lint` - code style
2. `npm test` - all tests
3. `npm run test:coverage` - coverage report uploaded as artifact

If any step fails → PR blocked.

---

## When to Write Tests

**Immediately after** implementing feature:
1. Backend agent writes endpoint → Test agent writes integration test
2. Frontend agent writes page → Test agent writes e2e test (or manual verification)
3. Database agent writes migration → Test agent writes repository test

**Before fixing bug**:
- Reproduce bug as failing test first
- Then fix code
- Test now passes ✓

---

## Mocking Strategy

Isolate unit tests with mocks:
- Mock Supabase client (don't hit real DB)
- Mock external APIs ( Sheets, email)
- Mock Date/Time when time-sensitive

Example:
```typescript
jest.mock("@supabase/supabase-js");
const mockSupabase = { /* ... */ };
```

---

## Related Skills

- `run_lint`: Run before tests to catch style issues
- `commit_changes`: Only commit if tests pass
- `search_code`: Find functions that need testing

---

**Agent Access**: Test agent primary, others for verification
**Rate Limit**: 5 runs per minute (tests are expensive)
**Safety**: Safe - does not modify code

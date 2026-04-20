# Skill: run_lint

**Purpose**: Execute linter (ESLint/TypeScript compiler checks) to validate code quality and style compliance.

**Signature**:
```typescript
run_lint(
  options?: {
    fix?: boolean,          // Auto-fixable issues
    files?: string[],       // Specific files to lint (default: all)
    format?: "stylish" | "json" | "compact"
  }
): Promise<LintResult>
```

**Parameters**:
- `options.fix` (boolean, optional): Attempt to auto-fix issues (default false).
- `options.files` (string[], optional): Array of file paths to lint (default: entire `src/`).
- `options.format` (string, optional): Output format (default "stylish").

**Returns**:
```typescript
{
  success: boolean,         // true if no errors (only warnings)
  errorCount: number,
  warningCount: number,
  fixedCount: number,       // Number of issues auto-fixed (if fix=true)
  output: string,           // Human-readable linter output
  files: Array<{
    path: string,
    errors: Array<{ line: number, column: number, message: string, ruleId: string }>,
    warnings: Array<...>
  }>
}
```

---

## Usage Examples

### Lint entire project
```
run_lint()
→ Checks all source files, returns summary
```

### Lint specific files only
```
run_lint({ files: ["src/db/provaRepository.ts", "src/admin/adminRoutes.ts"] })
→ Faster targeted check
```

### Auto-fix issues
```
run_lint({ fix: true })
→ Applies automatic fixes (import ordering, formatting)
```

### JSON output for parsing
```
run_lint({ format: "json" })
→ Machine-readable output for tooling
```

---

## Configuration

Linting is governed by `.eslintrc.*` configuration file in project root.

**Typical configuration** (`.eslintrc.json`):
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "semi": ["error", "never"],
    "quotes": ["error", "single"]
  }
}
```

---

## Common Lint Errors & Fixes

### Error: `@typescript-eslint/no-explicit-any`
**Cause**: Using `any` type
**Fix**: Replace `any` with `unknown` or specific type
```typescript
// Bad
function process(data: any) { }

// Good
function process(data: unknown) { }
// or
function process(data: Prova) { }
```

### Error: `no-unused-vars`
**Cause**: Variable declared but never used
**Fix**: Remove variable or prefix with `_` if intentional
```typescript
const _temp = calculate();  // Prefix with underscore to suppress
```

### Error: `semi` / `quotes`
**Cause**: Style violations
**Fix**: Run `run_lint({ fix: true })` or manually adjust

### Warning: `max-len`
**Cause**: Line exceeds length limit (usually 100-120 chars)
**Fix**: Break into multiple lines

---

## Workflow

### Pre-commit lint (recommended)
```
1. Write code
2. run_lint({ fix: true }) → auto-fix
3. run_lint() → verify no remaining errors
4. If errors → fix manually
5. commit_changes()
```

### CI lint (required)
CI pipeline runs lint on every PR:
```
npm run lint → fails if errorCount > 0
```

---

## Quality Gates

Before any commit (manual or automated):
- [ ] `run_lint()` returns `success: true` (no errors)
- [ ] All warnings reviewed (some warnings may be acceptable)
- [ ] Auto-fix applied (`fix: true`) if available
- [ ] No `eslint-disable` comments (unless justified)

---

## Fixing Lint Errors

### Manual Fix
Read error message → edit file → re-run lint.

### Auto-fix
```
run_lint({ fix: true }) → applies all auto-fixable rules
// Rerun to verify clean
run_lint()
```

### Suppress (rarely)
If lint rule is inappropriate for specific line:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getData();
```
⚠️ Use sparingly and add comment explaining why.

---

## Integration with Other Skills

- Run `run_lint` **after** `apply_change` or `write`
- Run `run_lint` **before** `commit_changes`
- Orchestrator runs `run_lint` as quality gate

---

## CI/CD Integration

`.github/workflows/lint.yml`:
```yaml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npm run lint
```

---

## Troubleshooting

### Lint fails but I don't understand error
```
1. Search rule name online: "eslint @typescript-eslint/no-explicit-any"
2. Read docs: https://typescript-eslint.io/rules/no-explicit-any/
3. Fix code accordingly
```

### Auto-fix didn't fix everything
Some errors are not auto-fixable (design issues). Fix manually.

### New file not being linted
Check if `eslint` includes the file pattern in config (`overrides` section may exclude).

---

## When to Ignore Lint

⚠️ **Never ignore lint in production code**. If a rule is problematic:
1. Discuss with Architect agent
2. Adjust `.eslintrc` configuration (not disable inline)
3. Apply project-wide

---

## Related Skills

- `run_tests`: Lint does not test functionality, run tests separately
- `apply_change`: Fix lint errors via code changes
- `commit_changes`: Only commit after lint passes

---

**Agent Access**: Architect, Backend, Frontend, Database
**Rate Limit**: 10 lint runs per minute (lint is expensive)
**Safety**: Safe - read-only check unless `fix: true`

# Skill: apply_change

**Purpose**: Apply a string replacement modification to an existing file (find exact oldString, replace with newString).

**Signature**:
```typescript
apply_change(
  filePath: string,
  oldString: string,
  newString: string,
  options?: {
    replaceAll?: boolean,   // Replace all occurrences (default: false)
    expectedMatches?: number // Expected number of matches (validation)
  }
): Promise<ChangeResult>
```

**Parameters**:
- `filePath` (string, required): Path to the file to modify.
- `oldString` (string, required): Exact text to find (must match exactly including whitespace).
- `newString` (string, required): Replacement text.
- `options.replaceAll` (boolean, optional): Replace all occurrences vs just first match.
- `options.expectedMatches` (number, optional): Validate that exactly N matches were found.

**Returns**:
```typescript
{
  success: boolean,
  filePath: string,
  matchesFound: number,
  matchesReplaced: number,
  backupCreated: boolean   // true if .bak file was saved
}
```

---

## Usage Examples

### Change a single occurrence
```
apply_change("src/server.ts", "PORT = 3000", "PORT = 3001")
→ Replaces first occurrence of "PORT = 3000"
```

### Change all occurrences
```
apply_change("src/admin/adminRoutes.ts", "status: 'draft'", "status: 'active'", {
  replaceAll: true
})
→ Replaces all 'draft' with 'active' in that file
```

### Expected validation
```
apply_change("config.ts", "NODE_ENV=development", "NODE_ENV=production", {
  expectedMatches: 1
})
→ Errors if 0 or >1 matches found (ensures uniqueness)
```

---

## How It Works (Step-by-Step)

1. reads the file content into memory
2. searches for `oldString` using exact string match (case-sensitive)
3. if `oldString` not found → throws `NoMatchError`
4. if `oldString` found >1 times and `replaceAll=false` → throws `MultipleMatchesError`
5. replaces match(es) with `newString`
6. creates a backup copy (`file.bak`) before writing
7. writes modified content back to disk
8. returns result summary

---

## Best Practices

✅ **DO**:
- **Always read_file first** to get the exact oldString (copy-paste it)
- Ensure `oldString` is unique in context (add surrounding lines if needed)
- Use `expectedMatches: 1` for single replacements to guarantee exact match
- Create small, focused changes (one logical change per apply_change)
- Verify indentation/spacing is preserved exactly

❌ **DO NOT**:
- Don't guess at the oldString - read the file to get it precisely
- Don't use for multi-file changes (one call per file)
- Don't use for creating new files (use `write` instead)
- Don't replace across non-contiguous lines (use multiple calls)

---

## Common Pitfalls & Solutions

### Problem: "Multiple matches found"
**Cause**: `oldString` appears multiple times in file.
**Solution**: Make `oldString` more specific (include more context lines).

```typescript
// Bad: generic match (multiple "500" in file)
apply_change("server.ts", "500", "401")

// Good: specific context
apply_change("server.ts",
  `res.status(500).json({ error: "internal" })`,
  `res.status(401).json({ error: "unauthorized" })`
)
```

### Problem: "No match found"
**Cause**: `oldString` differs slightly (whitespace, quotes, indentation).
**Solution**: Read file, copy exact oldString including spaces/tabs.

---

## Example Workflow

**Goal**: Change CORS origin in `src/config/cors.ts`

1. `read_file("src/config/cors.ts")`
   → See content:
   ```typescript
   const allowedOrigins = ["http://localhost:3000"];
   ```

2. `apply_change("src/config/cors.ts",
     'const allowedOrigins = ["http://localhost:3000"];',
     'const allowedOrigins = [process.env.CORS_ORIGIN || "http://localhost:3000"];'
   )`

3. Verify: `read_file` again or run `npm run lint`

---

## Validation Strategy

Before applying:
- [ ] Did you read the file first? (yes → continue)
- [ ] Is `oldString` exactly as it appears? (copy-paste verified)
- [ ] Is the change isolated to one location? (if not, use `replaceAll` intentionally)
- [ ] Does `newString` conform to code style? (indentation, semicolons)

After applying:
- [ ] Read file to confirm change applied correctly
- [ ] Run `run_lint` to check for syntax errors
- [ ] Run relevant tests (`run_tests`) if available

---

## Error Handling

Possible errors:

| Error | Cause | Recovery |
|-------|-------|----------|
| `NoMatchError` | oldString not found | Re-read file, check exact match |
| `MultipleMatchesError` | >1 match & replaceAll=false | Provide more context or set replaceAll=true |
| `FileNotFoundError` | File doesn't exist | Check path, create file with `write` if intended |
| `PermissionError` | No write permission | Check file permissions |
| `ValidationError` | expectedMatches check failed | Verify uniqueness of oldString |

---

## Safety Features

1. **Automatic backup**: Before modifying, creates `file.bak` in same directory.
2. **Atomic write**: Writes to temp file then renames (prevents corruption).
3. **Dry-run mode** (future): `apply_change({ dryRun: true })` shows what would change.

---

## When NOT to Use

- Creating new files → use `write`
- Deleting content → use `apply_change` with empty string (caution!)
- Multi-file refactoring → use multiple calls or orchestrator coordination
- Complex transformations → write a script or use code modification tools

---

## Related Skills

- `read_file`: Prerequisite - get exact oldString
- `write`: For new files
- `run_lint`: Validate after change
- `commit_changes`: Commit after verifying

---

**Agent Access**: All agents (backend, frontend, database, test, architect)
**Rate Limit**: 20 modifications per minute
**Safety**: Medium - destructive if used incorrectly. Always backup first.

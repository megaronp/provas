# Skill: grep

**Purpose**: Fast text search for literal strings (non-regex) across files. Simpler and faster than `search_code` when regex not needed.

**Signature**:
```typescript
grep(
  pattern: string,
  options?: {
    path?: string,
    filePattern?: string,
    caseSensitive?: boolean,
    maxResults?: number
  }
): Promise<GrepResults>
```

**Parameters**:
- `pattern` (string, required): Literal string to search for.
- `options.path` (string, optional): Search within specific directory.
- `options.filePattern` (string, optional): Filter by file extension (e.g., `"*.ts"`).
- `options.caseSensitive` (boolean, optional): Default false.
- `options.maxResults` (number, optional): Default 200.

**Returns**:
```typescript
{
  query: string,
  totalMatches: number,
  files: Array<{
    path: string,
    matches: Array<{
      line: number,
      text: string
    }>
  }>
}
```

---

## Usage Examples

### Find all console.log statements
```
grep("console.log")
→ Lists every occurrence of exact string "console.log"
```

### Find error messages
```
grep("NotFoundException", { filePattern: "*.ts" })
→ Finds that class name in TypeScript files
```

### Case-sensitive search
```
grep("ProvaSystem", { caseSensitive: true })
→ Only matches exact case
```

---

## grep vs search_code

| Feature | grep | search_code |
|---------|------|-------------|
| Pattern type | Literal string | Regular expression |
| Speed | Faster (simple substring) | Slower (regex engine) |
| Use case | Exact string search | Pattern matching |
| Example | `grep("TODO")` | `search_code("TODO:\\s*")` |

---

## Common Use Cases

- Find all `console.log` to remove before commit
- Search for hardcoded strings (URLs, API keys)
- Locate a specific error message
- Count occurrences of a variable name
- Verify a function name is used consistently

---

## Best Practices

✅ **DO**:
- Use `grep` for literal, fixed strings (faster)
- Combine with `apply_change` to remove/replace all occurrences
- Use `caseSensitive: true` for class names/identifiers
- Search for magic strings before refactoring

❌ **DO NOT**:
- Don't use when you need pattern matching (use `search_code`)
- Don't search for very common words ("the", "and") - too many results
- Don't search binary files (though they're usually excluded)

---

## Example Workflows

### Clean up console.logs
```
grep("console.log") → find all locations
→ For each file: apply_change to remove or comment out
```

### Find hardcoded credentials
```
grep("password", { caseSensitive: false })
→ Identify security issues
```

### Verify function rename
```
// Before renaming function `getUser` to `fetchUser`:
grep("getUser(") → list all call sites
// Rename with apply_change
grep("fetchUser(") → verify all updated
```

---

## Performance

- Much faster than `search_code` for simple strings (uses optimized substring search)
- Scales well to large codebases
- Limited to 200 results by default (increase `maxResults` if needed)

---

## Related Skills

- `search_code`: For regex patterns (more powerful, slightly slower)
- `apply_change`: Replace matches found by grep
- `glob`: List files first if you want to narrow scope

---

**Agent Access**: All agents
**Rate Limit**: 100 searches per minute
**Safety**: Safe - read-only operation

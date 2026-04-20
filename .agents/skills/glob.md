# Skill: glob

**Purpose**: List files matching a glob pattern (wildcards). Useful for finding sets of files by name, extension, or directory structure.

**Signature**:
```typescript
glob(
  pattern: string,
  options?: {
    path?: string,         // Base directory for search
    ignore?: string[],     // Patterns to exclude
    depth?: number         // Max directory depth (0=only current)
  }
): Promise<GlobResults>
```

**Parameters**:
- `pattern` (string, required): Glob pattern (e.g., `"**/*.ts"`, `"src/**/*.test.ts"`).
- `options.path` (string, optional): Search root (default: project root).
- `options.ignore` (string[], optional): Patterns to exclude (e.g., `["node_modules", "dist"]`).
- `options.depth` (number, optional): Max recursion depth.

**Returns**:
```typescript
{
  pattern: string,
  total: number,
  files: string[]  // Sorted by modification time (newest first)
}
```

---

## Glob Pattern Syntax

### Basic Patterns
```
*.ts           → all .ts files in current directory
**/*.ts       → all .ts files recursively
src/**/*.js   → all .js files under src/ (any depth)
!**/*.test.ts → exclude test files (with ignore option)
```

### Wildcards
- `*` matches any part of filename (except `/`)
- `?` matches single character
- `**` matches any number of directory levels
- `{}` brace expansion: `{*.ts,*.js}` matches ts OR js
- `!` negation (in ignore option)

### Examples
```
"**/*.{ts,tsx}"        → all TS/TSX files
"src/**/routes.*"      → route files (routes.ts, routes.js)
"tests/**/*.test.ts"   → all test files
"!**/node_modules/**"  → exclude node_modules
```

---

## Usage Examples

### Find all TypeScript files
```
glob("**/*.ts")
→ Returns: ["src/server.ts", "src/db/provaRepository.ts", ...]
```

### Find test files only
```
glob("**/*.test.ts")
→ Returns: ["tests/unit/prova.test.ts", "tests/integration/api.test.ts"]
```

### Find files in specific directory
```
glob("*.json", { path: "src/config/" })
→ Returns config files only
```

### Exclude certain patterns
```
glob("**/*.ts", { ignore: ["**/*.d.ts", "node_modules"] })
→ All TS except declaration files and dependencies
```

---

## Common Use Cases

- Locate all files with a given extension
- Find test files for a specific module
- List configuration files
- Discover all route definitions
- Identify files that match a naming convention

---

## Best Practices

✅ **DO**:
- Use `**/*.ts` for full project search
- Combine with `file_map.md` patterns for familiar file discovery
- Use `ignore` to skip `node_modules`, `dist`, `.git` (usually automatic)
- Sort results newest-first (default) to see recent files first

❌ **DO NOT**:
- Don't use `*.*` (matches everything including non-code)
- Don't search in ignored directories (explicitly exclude)
- Don't assume order (sort by modification if needed)

---

## Example: Find Related Files

**Task**: "Find all files related to provas"

1. `glob("**/*prova*")` → matches provaRepository, provaRoutes, prova.model, etc.
2. `glob("**/*.ts", { path: "src/db/" })` → all DB layer files
3. `glob("provas*.ts")` → files starting with "provas"

---

## Integration with Other Skills

- Use `glob` to get file list → `read_file` each file
- Use `glob` to find tests → `run_tests` with specific pattern
- Use `glob` before `search_code` to limit scope

```
const testFiles = await glob("**/*.test.ts");
for (const file of testFiles) {
  const content = await read_file(file);
  // analyze...
}
```

---

## Performance

- Fast directory walking using efficient OS APIs
- Large repositories (10k+ files) still performant
- Depth limiting can improve speed for shallow searches

---

## Related Skills

- `search_code`: After glob finds files, search within them
- `read_file`: Read matched files
- `grep`: Search within files (but glob first to narrow scope)

---

**Agent Access**: All agents
**Rate Limit**: 200 queries per minute
**Safety**: Safe - read-only directory listing

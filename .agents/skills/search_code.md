# Skill: search_code

**Purpose**: Search for code patterns across the codebase using regular expressions.

**Signature**:
```typescript
search_code(
  pattern: string,
  options?: {
    path?: string,           // Search within specific directory
    filePattern?: string,    // Filter by file extension (e.g., "*.ts")
    caseSensitive?: boolean,
    maxResults?: number
  }
): Promise<SearchResults>
```

**Parameters**:
- `pattern` (string, required): Regex pattern to search for.
- `options.path` (string, optional): Restrict search to a specific folder.
- `options.filePattern` (string, optional): File glob pattern (e.g., `"*.ts"`, `"**/*.test.ts"`).
- `options.caseSensitive` (boolean, optional): Default false (case-insensitive).
- `options.maxResults` (number, optional): Default 100, max 1000.

**Returns**:
```typescript
{
  query: string,
  totalMatches: number,
  files: [
    {
      path: string,
      lineCount: number,
      matches: Array<{
        line: number,
        column: number,
        text: string
      }>
    }
  ]
}
```

---

## Usage Examples

### Find a class definition
```
search_code("class ProvaRepository")
→ Returns all files containing that class name
```

### Find all TODO comments
```
search_code("TODO", { filePattern: "*.ts" })
→ Lists todos in TypeScript files only
```

### Find a specific function call
```
search_code("supabase\\.from\\(", { path: "src/db/" })
→ Finds all Supabase query calls in db folder
```

---

## Regex Syntax

Use standard JavaScript regex:

- `.` matches any character
- `*` zero or more
- `+` one or more
- `?` optional
- `\b` word boundary
- `^` start of line
- `$` end of line
- `[abc]` character class
- `(group)` capture group
- `\|` OR

**Examples**:
```
"function\s+get\w+"     → function declarations starting with "get"
"import\s+.*from"       → import statements
"// TODO"              → TODO comments
"@test"                → Jest test decorators
```

---

## Common Use Cases

- Locate where a function is defined
- Find all usages of a variable/class
- Search for error messages or log strings
- Identify TODOs/FIXMEs in code
- Find API endpoint definitions
- Locate configuration references

---

## Best Practices

✅ **DO**:
- Use word boundaries (`\b`) to avoid partial matches
- Escape special characters when searching for literal strings: `\.` instead of `.`
- Limit scope with `path` or `filePattern` for faster results
- Combine with `read_file` to inspect matched files

❌ **DO NOT**:
- Use extremely broad patterns (e.g., `"a"`) - will return too many matches
- Search in `node_modules/` (excluded automatically in most cases)
- Assume first result is correct - verify context

---

## Performance Notes

- Search runs over entire project (can be slow for large repos)
- Use `path` or `filePattern` to narrow scope
- Results limited to 1000 by default (adjust with `maxResults`)

---

## Related Skills

- `grep`: Faster but simpler text search (no regex)
- `read_file`: Read the matched file to see full context
- `glob`: List files first, then search within subset

---

**Agent Access**: All agents
**Rate Limit**: 20 searches per minute
**Safety**: Safe - read-only operation

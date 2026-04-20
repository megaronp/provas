# Skill: write

**Purpose**: Create a new file with given content (or overwrite existing file). Use with caution - this creates or replaces files.

**Signature**:
```typescript
write(
  filePath: string,
  content: string,
  options?: {
    overwrite?: boolean,    // Allow overwrite existing (default: false)
    createDirectories?: boolean // Create parent dirs if missing (default: true)
  }
): Promise<WriteResult>
```

**Parameters**:
- `filePath` (string, required): Path where file will be created.
- `content` (string, required): Full content to write.
- `options.overwrite` (boolean, optional): Default false - fails if file exists.
- `options.createDirectories` (boolean, optional): Default true - auto-creates parent folders.

**Returns**:
```typescript
{
  success: boolean,
  filePath: string,
  size: number,
  created: boolean,          // true if new file, false if overwritten
  directoriesCreated: string[] // List of dirs created (if any)
}
```

---

## Usage Examples

### Create a new test file
```
write("tests/unit/provaRepository.test.ts", testCodeContent)
→ Creates new test file with full content
```

### Create directory structure automatically
```
write("src/new-feature/config.ts", "export const config = {...}", {
  createDirectories: true
})
→ Creates `src/new-feature/` folder if it doesn't exist
```

### Overwrite an existing file (explicit)
```
write("README.md", newContent, { overwrite: true })
→ Replaces entire README (use carefully!)
```

---

## Safety & Constraints

### Default: Non-destructive
By default `overwrite: false`, so:
- ✅ File doesn't exist → creates it
- ❌ File exists → throws `FileExistsError`

To overwrite, you must **explicitly** set `overwrite: true`.

### Path restrictions
- Only write within project workspace
- No path traversal (`../../../etc/passwd` blocked)

### Encoding
- UTF-8 text only
- Binary content should be encoded (base64) or use different approach

---

## When to Use write vs apply_change

| Scenario | Use |
|----------|-----|
| Creating brand new file | `write` |
| Adding a new route file | `write` |
| Generating a new test file | `write` |
| Modifying existing file | `apply_change` |
| Renaming file | `git mv` + write new content (if needed) |

---

## Best Practices

✅ **DO**:
- Verify parent directory structure makes sense before writing
- Use `read_file` to check if file already exists (if unsure)
- Include full file content (not partial)
- Set `createDirectories: true` for new nested folders
- Get explicit approval via Orchestrator before overwriting existing files

❌ **DO NOT**:
- Don't use to append to file (use `apply_change` at EOF instead)
- Don't use for simple one-line changes in existing files
- Don't overwrite files without checking current content first
- Don't write to `node_modules/` or generated folders

---

## Example: Creating New Test File

```typescript
// Task: Create provaRepository.test.ts
const content = `import { ProvaRepository } from "../../src/db/provaRepository";
import { SupabaseClient } from "@supabase/supabase-js";

const mockSupabase = { /* ... */ } as unknown as SupabaseClient;

describe("ProvaRepository", () => {
  // tests here...
});

export {};
`;

write("tests/unit/repositories/provaRepository.test.ts", content);
```

---

## Validation After Write

After writing a new file:
1. `read_file` it back to verify content written correctly
2. If TypeScript: run `run_lint` to check syntax
3. If test file: run `run_tests` to ensure it executes
4. If it's a config file: validate format (JSON.parse if .json)

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `FileExistsError` | File exists and overwrite=false | Set `overwrite: true` or use different filename |
| `PermissionError` | Cannot write to directory | Check folder permissions |
| `InvalidPathError` | Path contains `..` or absolute outside project | Use relative path within project |
| `EncodingError` | Content not valid UTF-8 | Ensure text is properly encoded |

---

## Workflow Integration

 Orchestrator typically uses `write` for:
- Creating initial scaffolding files
- Generating new test files
- Adding new agent definitions
- Bootstrapping new modules

Individual agents use `write` sparingly:
- Frontend agent: creating new page HTML
- Backend agent: creating new repository file (first version)
- Test agent: creating new test suite

---

## Related Skills

- `apply_change`: For modifying existing files
- `read_file`: To verify written content
- `run_lint`: Validate syntax of written code
- `commit_changes`: Commit after writing

---

**Agent Access**: All agents (with caution)
**Rate Limit**: 10 files per minute
**Safety**: High-risk for overwrites; requires explicit `overwrite: true` flag.

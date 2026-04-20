# Skill: read_file

**Purpose**: Read the complete content of a file from the local filesystem.

**Signature**:
```typescript
read_file(filePath: string): Promise<FileContent>
```

**Parameters**:
- `filePath` (string, required): Absolute or relative path to the file within the project directory.

**Returns**:
```typescript
{
  content: string,           // Complete file content as string
  size: number,              // File size in bytes
  modified: Date,            // Last modification timestamp
  path: string               // Normalized absolute path
}
```

**Errors**:
- `FileNotFoundError`: File does not exist at the given path.
- `BinaryFileError`: File appears to be binary (cannot read as text).
- `PermissionError`: No read permission for the file.
- `MaxSizeExceededError`: File exceeds safe read limit (10MB).

---

## Usage Examples

### Basic file read
```
read_file("src/server.ts")
→ Returns content, size, modified date
```

### Read configuration file
```
read_file(".env.example")
→ Returns environment variable template
```

### Read multiple files sequentially
```
const packageJson = await read_file("package.json");
const tsconfig = await read_file("tsconfig.json");
```

---

## Constraints & Safety

1. **Path restrictions**:
   - Only files within the project workspace are accessible.
   - Path traversal attempts (`../../../etc/passwd`) are blocked.

2. **File types**:
   - Text files only (UTF-8 encoded).
   - Binary files (images, compiled files) will error.

3. **Size limits**:
   - Maximum 10MB per file read.
   - Larger files should be read in chunks (different skill needed).

4. **Context management**:
   - Agents should limit concurrent `read_file` calls to avoid context overflow.
   - Recommended: max 5-10 files per analysis session.

---

## Common Use Cases

- Inspecting existing code before modification
- Reading configuration files (package.json, tsconfig.json)
- Understanding project structure (README.md, docs)
- Reviewing test files to understand expected behavior
- Checking current state before applying changes

---

## Best Practices

✅ **DO**:
- Read the file first before applying changes (to get exact oldString)
- Verify file path is correct (use `file_map.md` reference)
- Check file size if uncertain (large files may need different approach)

❌ **DO NOT**:
- Read files outside the project (blocked anyway)
- Read the same file repeatedly in a loop (cache content if needed)
- Attempt to read binary files (use specialized skills if needed)

---

## Related Skills

- `search_code`: Use after reading to find patterns within the file.
- `apply_change`: Use reading first to get exact content to replace.
- `write`: For creating new files (use cautiously).

---

**Agent Access**: All agents
**Rate Limit**: 50 files per session (soft limit)
**Safety**: Safe - read-only operation

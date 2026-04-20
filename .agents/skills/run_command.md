# Skill: run_command

**Purpose**: Execute a shell command on the local system (with permission restrictions).

**Signature**:
```typescript
run_command(
  command: string,
  options?: {
    timeout?: number,       // Max execution time in ms (default 30000)
    env?: Record<string, string>, // Custom environment variables
    shell?: boolean,        // Use shell (default: false, direct exec)
    captureOutput?: boolean // Capture stdout/stderr (default true)
  }
): Promise<CommandResult>
```

**Parameters**:
- `command` (string, required): Command to execute (e.g., `"npm run build"`).
- `options.timeout` (number, optional): Kill after N milliseconds.
- `options.env` (object, optional): Additional env vars for the process.
- `options.shell` (boolean, optional): Run through shell (allows pipes, redirects). Default false.
- `options.captureOutput` (boolean, optional): Capture stdout/stderr (default true).

**Returns**:
```typescript
{
  success: boolean,         // True if exit code 0
  exitCode: number,         // Process exit code
  stdout: string,           // Standard output (if captured)
  stderr: string,           // Standard error (if captured)
  duration: number,         // Execution time in ms
  killed: boolean           // True if killed by timeout
}
```

---

## Allowed Commands

### Safe (allowed by default)
- `npm run <script>` - package.json scripts
- `npx <tool>` - npm executables
- `ls`, `pwd`, `cat` - file inspection (with path restrictions)
- `git status`, `git diff`, `git log` - git operations (read-only)
- `tsc --noEmit` - TypeScript type checking
- `node --check file.ts` - syntax validation

### Restricted (requires explicit approval)
- `rm`, `mv`, `mkdir`, `rmdir` - file modifications (use agent skills instead)
- `git push`, `git reset` - history-altering operations
- `chmod`, `chown` - permission changes
- `sudo`, `su` - privilege escalation
- Any command writing outside project directory

### Blocked (never allowed)
- Format strings (risk of injection)
- `eval`, `exec` with unsanitized input
- Network-altering commands (curl to external except approved)
- Database raw SQL (use repositories instead)

---

## Usage Examples

### Run linter
```
run_command("npm run lint")
→ Executes ESLint, returns output
```

### Build TypeScript
```
run_command("npm run build")
→ Compiles to dist/
```

### Check types without building
```
run_command("npx tsc --noEmit")
→ Type-checks all files, no output files
```

### Git status
```
run_command("git status")
→ Returns current repo state
```

---

## Recommended Workflow

### Pre-commit verification
```
1. run_lint()  → use built-in skill (preferred)
2. run_tests() → use built-in skill (preferred)
3. If need shell: run_command("npm run build") to verify build
4. commit_changes()
```

### Build verification
```
run_command("npm run build", { timeout: 60000 })
→ Ensures project compiles before PR
```

### Type checking only (fast)
```
run_command("npx tsc --noEmit", { timeout: 30000 })
→ Quick syntax validation
```

---

## Safety Measures

### Command Whitelisting
Only commands from approved list can run without special approval:
- npm scripts defined in `package.json`
- tsc, node, npx with safe arguments
- git read-only commands

### Path Restrictions
- Commands can only operate within project directory
- `..` in paths blocked unless explicitly allowed
- Absolute paths must be within workspace

### Output Size Limits
- Max 1MB stdout/stderr combined
- Truncates beyond that (head/tail of output)

### Timeouts
- Default 30 seconds
- Long-running commands (build) can specify longer (max 5 min)

---

## Common Use Cases

### Development tasks
| Task | Command |
|------|---------|
| Lint code | `npm run lint` |
| Run tests | `npm test` |
| Build project | `npm run build` |
| Type check | `npx tsc --noEmit` |
| Dev server | `npm run dev` (with long timeout) |

### Git operations (read-only)
| Task | Command |
|------|---------|
| Check status | `git status` |
| View changes | `git diff` |
| Recent commits | `git log -5 --oneline` |
| Current branch | `git branch --show-current` |

### Package management
| Task | Command |
|------|---------|
| Install deps | `npm ci` (CI) / `npm install` (dev) |
| Update lockfile | `npm update` |
| Audit | `npm audit` |

---

## Error Handling

If command fails (`exitCode !== 0`):
```
{
  success: false,
  exitCode: 1,
  stderr: "Error message...",
  stdout: ""
}
```

**Examples**:

### Build failure
```typescript
const result = await run_command("npm run build");
if (!result.success) {
  console.error("Build failed:", result.stderr);
  // Don't commit broken build
}
```

### Test failure
```typescript
const testResult = await run_command("npm test");
if (!testResult.success) {
  throw new Error("Tests failing - fix before commit");
}
```

---

## Best Practices

✅ **DO**:
- Use `run_command` **sparingly** - prefer built-in skills (`run_lint`, `run_tests`)
- Always check `result.success` before proceeding
- Set appropriate `timeout` for long operations
- Capture output for debugging

❌ **DO NOT**:
- Don't use for file edits (use `write`, `apply_change`)
- Don't use for installing packages (ask Orchestrator)
- Don't pipe commands together (`cmd1 | cmd2`) unless necessary
- Don't run untrusted input as command (injection risk)

---

## Security Considerations

### Shell Injection Prevention
- `shell: false` (default) - direct exec, no shell interpretation
- If `shell: true` required, validate/sanitize command thoroughly
- Never interpolate user input into command string

Example vulnerable:
```typescript
// BAD - injection risk!
run_command(`npm install ${userInput}`);
// User could input: "foo && rm -rf /"

// GOOD - validate input
const pkg = validatePackageName(userInput);
run_command(`npm install ${pkg}`);  // safe now
```

---

## Output Examples

### Successful build
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "> prova-system@1.0.0 build\n> tsc\n",
  "stderr": "",
  "duration": 5432,
  "killed": false
}
```

### Failed test
```json
{
  "success": false,
  "exitCode": 1,
  "stdout": "",
  "stderr": "FAIL  tests/unit/prova.test.ts\n● should create prova...\n  Expected: 1\n  Received: 0",
  "duration": 1240,
  "killed": false
}
```

---

## Performance Tips

- Run commands in parallel when independent (but be mindful of resource contention)
- Cache results of expensive commands if re-running (e.g., `npm ls` depth)
- Use `--silent` flags if output not needed

---

## Integration with Other Skills

Typical sequence:
```
1. apply_change() - modify code
2. run_command("npx tsc --noEmit") - quick syntax check
3. run_lint() - style check (preferred over npm run lint)
4. run_tests() - functional test (preferred)
5. run_command("npm run build") - verify build (if needed)
6. commit_changes() - save
```

---

## Troubleshooting

### Command hangs
→ Increase timeout or kill process:
```typescript
run_command("npm run dev", { timeout: 120000 })  // 2 minutes
```

### Command not found
→ Ensure command is in PATH or use full path (`/usr/bin/node`)

### Permission denied
→ Check file permissions on executable

---

## Alternatives (when not to use)

| Need | Better Skill |
|------|--------------|
| Read file | `read_file` |
| Modify file | `apply_change` |
| Create file | `write` |
- Lint code | `run_lint`
- Run tests | `run_tests`

Use `run_command` only when no specialized skill exists.

---

**Agent Access**: Backend (build/deploy), Test (custom test runners), Orchestrator (orchestration)
**Rate Limit**: 30 commands per minute
**Safety**: Medium - executes shell commands. Use with caution. Default `shell: false` recommended for safety.

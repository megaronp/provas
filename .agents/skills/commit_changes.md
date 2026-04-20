# Skill: commit_changes

**Purpose**: Stage all modified files and create a git commit with a standardized message.

**Signature**:
```typescript
commit_changes(
  message: string,
  options?: {
    files?: string[],        // Specific files to stage (default: all)
    amend?: boolean,         // Amend previous commit (default false)
    noVerify?: boolean       // Skip pre-commit hooks (default false)
  }
): Promise<CommitResult>
```

**Parameters**:
- `message` (string, required): Commit message following convention.
- `options.files` (string[], optional): List of files to stage (default: `git add -A`).
- `options.amend` (boolean, optional): Amend last commit instead of new commit.
- `options.noVerify` (boolean, optional): Bypass commit hooks.

**Returns**:
```typescript
{
  success: boolean,
  commitHash: string,
  message: string,
  filesStaged: string[],
  branch: string
}
```

---

## Commit Message Format

Strict format required:
```
<agent>(<scope>): <subject>

<body>

<footer>
```

### Examples

```
backend(provas): add validation for date range

- Add validation that data_fim > data_inicio
- Return 400 with error code DATE_RANGE_INVALID
- Update ProvaRepository to check before insert

Closes #12
```

```
frontend(styles): fix modal overflow on mobile screens

The modal content was overflowing on screens < 576px.
Added .modal-responsive class with proper max-height.

Fixes: #15
```

```
database(migration): add index on respostas.submissao_id

CREATE INDEX idx_respostas_submissao ON respostas(submissao_id)
to speed up JOIN queries for report generation.

Closes #23
```

---

## Format Breakdown

### Type (first line before parentheses)
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation changes
- `refactor` - code restructuring (no functional change)
- `test` - adding or fixing tests
- `chore` - maintenance tasks (dependencies, config)
- `style` - formatting only (no logic change)

### Agent tag (in parentheses)
Indicates which agent made the change:
- `(backend)`, `(frontend)`, `(database)`, `(test)`, `(architect)`, `(orchestrator)`

### Scope (inside parentheses after agent)
The area of code changed:
- `(provas)`, `(questoes)`, `(styles)`, `(config)`, `(db)`

### Subject (after colon)
Short summary, imperative mood: "add", "fix", "update", not "added", "fixed"

### Body (optional)
Explain what and why (not how). 72-character line width.

### Footer (optional)
Reference issue numbers: `Closes #123`, `Fixes #456`, `Related to #789`

---

## Quality Checklist Before Commit

### 1. Code Review (self)
- [ ] Change is minimal and focused (one concern per commit)
- [ ] No debug `console.log` statements
- [ ] No commented-out code
- [ ] No secrets/credentials
- [ ] Tests added (if applicable)
- [ ] Lint passes (`run_lint`)

### 2. Functional Verification
- [ ] Manually tested the change (if UI)
- [ ] API endpoint returns expected response
- [ ] No regressions in related functionality

### 3. Commit Message Quality
- [ ] Follows `<agent>(<scope>): <subject>` format
- [ ] Subject is imperative ("add", not "added")
- [ ] Scope is accurate (which module touched)
- [ ] Issue reference included if applicable (`Closes #123`)

---

## Common Mistakes

❌ **Bad**: `"fixed stuff"` (too vague, no format)
❌ **Bad**: `"backend: add prova endpoint"` (missing agent tag parentheses)
❌ **Bad**: `"feat(provas): added validation"` (should be "add", not "added")
✅ **Good**: `backend(provas): add date validation to prova creation`

---

## What Gets Staged

Default (`git add -A`):
- All modified tracked files
- All new untracked files
- Excludes files in `.gitignore`

With `files` option:
- Only specified files are staged
- Useful for selective commits

Example:
```
commit_changes("fix: typo in README", { files: ["README.md"] })
→ Only README.md committed, not other pending changes
```

---

## Workflow Example

**Scenario**: Backend agent implements POST `/api/admin/provas` endpoint

1. Implemented code: `src/admin/adminRoutes.ts`, `src/db/provaRepository.ts`
2. Verified manually: API works, returns correct JSON
3. Ran lint: `run_lint()` → passes
4. Ran tests: `run_tests({ pattern: "prova" })` → passes
5. Commit:
   ```
   commit_changes("backend(provas): implement create prova endpoint with validation", {
     files: ["src/admin/adminRoutes.ts", "src/db/provaRepository.ts"]
   })
   ```

---

## Git Hooks Integration

Pre-commit hook (recommended):
```
# .git/hooks/pre-commit (or via husky)
npm run lint
npm run test -- --findRelatedTests
# If either fails, commit blocked
```

Our system enforces:
- Lint must pass (or `noVerify: true` explicitly)
- Tests must pass (if Test agent has configured hook)

---

## Amending Commits

Use `amend: true` to modify the most recent commit:
```typescript
// Oops, forgot to include a file
commit_changes("chore: add .gitignore entry", { amend: true, files: [".gitignore"] })
```

⚠️ Only amend **unpushed** commits (to avoid history rewrite issues).

---

## Reverting Commits

If a commit introduces a bug:
```
git revert <commit-hash>
```
Creates a new commit that undoes the changes. Preferred over `git reset` for shared branches.

---

## Branching Strategy Integration

Commit messages help track which branch:
- `main` → production commits only (after PR merge)
- `develop` → staging commits
- `feature/xyz` → feature development

Commit message format same across all branches.

---

## Related Skills

- `run_lint`: Run before committing
- `run_tests`: Run before committing
- `create_pr`: After committing (opens PR)

---

**Agent Access**: All agents (can commit their own changes)
**Rate Limit**: 20 commits per hour (prevent spam)
**Safety**: Commits are permanent (but revertible). Always verify before committing.

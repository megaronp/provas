# Skill: create_pr

**Purpose**: Create a Pull Request (or Merge Request) on GitHub from current branch to target branch.

**Signature**:
```typescript
create_pr(
  title: string,
  body: string,
  options?: {
    base?: string,          // Target branch (default: main)
    head?: string,          // Source branch (default: current)
    draft?: boolean,        // Create as draft PR
    reviewers?: string[],   // GitHub usernames to request review
    labels?: string[]       // Labels to apply
  }
): Promise<PRResult>
```

**Parameters**:
- `title` (string, required): PR title (should match commit subject convention).
- `body` (string, required): PR description (markdown supported).
- `options.base` (string, optional): Branch to merge into.
- `options.head` (string, optional): Branch containing changes.
- `options.draft` (boolean, optional): Create as draft PR.
- `options.reviewers` (string[], optional): Request reviews.
- `options.labels` (string[], optional): Apply labels (e.g., `["feat", "backend"]`).

**Returns**:
```typescript
{
  success: boolean,
  url: string,              // GitHub PR URL
  number: number,           // PR number
  title: string,
  body: string,
  state: "open" | "draft",
  createdAt: Date
}
```

---

## Git Flow Integration

### Standard Workflow
```
1. Create feature branch
   git checkout -b feature/add-export-csv

2. Make changes (agent work)
   → modify files, commit_changes()

3. Push branch
   git push -u origin feature/add-export-csv

4. Create PR
   create_pr(
     "feat(admin): add CSV export for reports",
     "Implements CSV export functionality...\n\nCloses #45"
   )

5. CI runs (lint + tests)

6. Review & merge
```

---

## PR Title Convention

PR title should match **first line of latest commit message** (or be the aggregate if multiple commits):

```
backend(provas): add date validation logic
```

If multiple commits, summarize the overall change:
```
feat(admin): implement reports dashboard
```

---

## PR Body Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Testing
- [ ] Manual testing completed
- [ ] Automated tests added/updated
- [ ] Lint passing

## Issues
Closes #123
Fixes #456
Related to #789

## Checklist
- [ ] Code follows CONVENTIONS.md
- [ ] Self-reviewed
- [ ] No console.log statements
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or clearly documented)
```

---

## Usage Examples

### Create standard PR
```
create_pr(
  "backend(provas): add POST /provas endpoint",
  "## Summary\nAdds endpoint to create prova with questions.\n\n## Changes\n- Added route in adminRoutes.ts\n- Implemented ProvaRepository.create()\n- Added validation schema\n\n## Testing\n- Manual tested via Postman\n- Unit tests pass\n\nCloses #12"
)
```

### Create draft PR (work in progress)
```
create_pr({
  title: "feat(styles): redesign admin dashboard",
  body: "WIP - still iterating on design",
  draft: true
})
→ PR marked as Draft, won't merge until ready
```

### PR with requested reviewers
```
create_pr({
  title: "feat(database): add index on submissoes",
  body: "Performance improvement...",
  reviewers: ["alice", "bob"]
})
→ Alice and Bob get GitHub review request
```

---

## PR States

| State | Meaning |
|-------|---------|
| `open` | Active, ready for review |
| `draft` | Work in progress, not ready |
| `merged` | Changes integrated |
| `closed` | PR abandoned |

---

## CI Integration

When PR is created:
1. GitHub Actions automatically triggers:
   - `npm run lint`
   - `npm test`
   - `npm run test:coverage`
2. Checks appear on PR page (green ✓ or red ✗)
3. Merge blocked if CI fails (branch protection rules)

---

## Review Process

1. **Self-review**: Agent checks own changes before PR
2. **CI check**: Automated lint + tests pass
3. **Human/agent review**: Other agent reviews code
4. **Address feedback**: Make additional commits to same branch
5. **Squash & merge** (or rebase): Clean history before merging

---

## Common Issues

### PR creation fails: "No commits between branches"
**Cause**: Branch identical to base (no changes).
**Fix**: Make at least one commit before PR.

### CI fails after PR
**Cause**: Tests or lint fail on CI environment (different from local).
**Fix**: Run `npm test` and `npm run lint` locally before PR.

### Wrong base branch
**Cause**: PR targets `develop` instead of `main`.
**Fix**: Specify `base: "main"` in options.

---

## Branch Naming Conventions

```
feature/short-description    # New feature
fix/issue-brief              # Bug fix
hotfix/critical-issue        # Urgent production fix
refactor/area                # Refactoring
docs/update-readme           # Documentation
chore/update-deps            # Maintenance
```

---

## Labels (Automation)

Common labels applied via API:
- `feat` / `bug` / `docs` / `chore` - type
- `backend` / `frontend` / `database` - area
- `priority:high` / `priority:low` - urgency
- `status:blocked` - needs attention

---

## Related Skills

- `commit_changes`: PR requires at least one commit
- `run_tests`: CI runs tests automatically
- `run_lint`: CI runs lint automatically
- `search_web`: Look up GitHub API docs if needed

---

**Agent Access**: Backend, Frontend, Database, Test, Architect (after review)
**Rate Limit**: 10 PRs per hour (GitHub API limit)
**Safety**: PRs are reviewable - safe to create, merge requires human (or Architect) approval

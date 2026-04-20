# Orchestrator Guide

## Overview

O Orchestrator é o agente coordenador do sistema. Sua função é gerenciar o fluxo de trabalho, delegar tarefas aos agentes especialistas, e manter a memória persistente do projeto.

---

## Responsabilidades Core

### 1. Task Decomposition
Quando recebe uma tarefa complexa (ex: "implementar exportação CSV"):
- Decompõe em subtasks sequenciais
- Identifica dependências entre tasks
- Estima complexidade (pequena/média/grande)

### 2. Agent Assignment
Para cada subtask:
- Seleciona agente apropriado (backend, frontend, database)
- Considera contexto atual (quem está busy)
- Prioriza tasks bloqueantes primeiro (migrations antes de código)

### 3. Progress Tracking
- Monitora status de cada subtask (pending, in_progress, completed, blocked)
- Registra outcomes na memória
- Detecta loops/failures e re-rota tasks

### 4. Memory Management
- Atualiza `memory/decisions_log.md` com decisões tomadas
- Atualiza `memory/change_history.md` com mudanças aplicadas
- Reporta issues para `memory/known_issues.md`

### 5. Integration & Quality Gate
- Valida outputs de múltiplos agentes
- Garante arquitetura consistente
- Bloqueia commits se quality gate falhar

---

## Workflow Pattern

```
User Task Input
    ↓
[Orchestrator analyzes]
    ↓
Decompose into subtasks
    ↓
┌───────────────────────┐
│ Subtask 1: Database   │ ──► Database Agent
│ - Add column          │
│ - Create index        │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│ Subtask 2: Backend    │ ──► Backend Agent
│ - Update repository   │
│ - Validate new field  │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│ Subtask 3: Frontend   │ ──► Frontend Agent
│ - Show new field      │
│ - Form validation     │
└──────────┬────────────┘
           │
    [Orchestrator validates all]
           │
    Memory updated
           │
    Done ✓
```

---

## Task Prioritization

### Priority 1 - Blocking (must do first)
- Database migrations
- Schema changes
- Config file updates (`tsconfig.json`, `package.json`)

### Priority 2 - Core Logic
- Backend endpoints
- Repository logic
- Validation rules

### Priority 3 - UI
- Frontend pages
- User interactions
- Styling

### Priority 4 - Polish
- Tests
- Documentation
- Performance optimization

---

## Agent Selection Matrix

| Task Type | Primary Agent | Secondary | Consult |
|-----------|--------------|-----------|---------|
| Criar tabela/coluna | Database | - | Architect (approval) |
| Implementar endpoint | Backend | - | Architect (review) |
| Criar página UI | Frontend | Backend (API) | - |
| Escrever testes | Test | - | Backend (coverage) |
| Refatoração grande | Architect | - | Todos (coordination) |
| Decisão arquitetural | Architect | Orchestrator | - |
| Bug fix simples | Qualquer um | - | - |

---

## Memory Files (Persistent State)

### `memory/decisions_log.md`
Log de decisões técnicas tomadas:

```markdown
## 2025-04-18 - Exportação CSV
**Decision**: Implementar via endpoint stream CSV (não Sheets)
**Rationale**: Simplicidade, sem dependência externa
**Alternatives considered**: Google Sheets integration (rejected - too complex)
**Owner**: Backend agent
```

### `memory/known_issues.md`
Problemas conhecidos não resolvidos:

```markdown
- [ ] Queries lentas em relatórios com many submissions (TODO: index)
- [ ] Frontend mobile modals overflow (TODO: CSS fix)
- [ ] Sem retry em Supabase RLS errors (TODO: implement)
```

### `memory/change_history.md`
Histórico de mudanças aplicadas:

```markdown
| Date | File | Change | Agent | Issue |
|------|------|--------|-------|-------|
| 2025-04-18 | src/db/provaRepository.ts | added create method | Backend | #12 |
| 2025-04-18 | .agents/ARCHITECTURE.md | ADR-001 migration | Architect | - |
```

---

## Integration Process

### Step 1: Receive Task
```
User: "Adicionar campo 'duracao' em provas"
↓
Orchestrator reads index.json, file_map.md
```

### Step 2: Decompose
```
1. Database: ALTER TABLE provas ADD COLUMN duracao_minutos INT
2. Backend: atualizar Prova.ts, provaRepository.create()
3. Frontend: adicionar campo no form de criar prova
```

### Step 3: Assign Sequentially
```
→ Database agent (migration)
   └─> Output: supabase/migrations/XXXX.sql

→ Backend agent (types + repository)
   └─> Output: Prova.ts updated, provaRepository.ts updated

→ Frontend agent (form + validation)
   └─> Output: public/admin/js/pages/provas.js updated
```

### Step 4: Validate Integration
```
- Check consistency: Do all three parts agree on field name "duracao_minutos"?
- Check types: Is it INT in DB, number in TS, number in JS?
- Run lint: npm run lint passes?
- Run tests: npm run test passes?
```

### Step 5: Update Memory
```
- decisions_log.md: "Decisão: adicionar duração em minutos (não em HH:MM)"
- change_history.md: Registra todas 3 mudanças
```

### Step 6: Report to User
```
✅ Feature "duracao_minutos em provas" implementada:
   - Migration aplicada
   - Backend atualizado
   - Frontend atualizado
```

---

## Quality Gates

Antes de aprovar conclusão de task:

1. **Code Review** (auto)
   - Lint passing (`run_lint`)
   - No `any` types
   - Error handling present

2. **Architecture Compliance**
   - Segue `CONVENTIONS.md`
   - Não viola `ARCHITECTURE.md` ADRs
   - Repository pattern mantido

3. **Integration Check**
   - Frontend + Backend endpoints matching
   - Database schema matches models
   - No breaking changes (backward compatibility)

4. **Tests** (when applicable)
   - Unit tests added (Backend/Database)
   - Integration tests added (Test agent involvement)
   - Coverage maintained/increased

---

## Failure Recovery

### Scenario: Agent fails 3 times
```
→ Re-analyse task
→ Simplify instructions
→ Assign to different agent
→ If still fails: escalar para Architect review
```

### Scenario: Merge conflict (git)
```
→ Orchestrator resolve conflito
→ Usa `apply_change` para merge manual
→ Se complexo: Architect intervention
```

### Scenario: Breaking change detected
```
→ Rollback: `git revert <commit>`
→ Notify all agents
→ Update known_issues.md with regression
```

---

## Communication Protocol

### Between Orchestrator and Agents

**Messages**:
- `TASK_ASSIGN`: "Agent X, execute Y"
- `TASK_COMPLETE`: "Done, here is output summary"
- `TASK_BLOCKED`: "Blocked, need Z from Agent Y"
- `QUERY`: "What is status of feature Z?"

**Data Format**:
```json
{
  "task_id": "uuid",
  "agent": "backend",
  "action": "create_endpoint",
  "parameters": { ... },
  "priority": 2,
  "depends_on": ["db-migration-123"]
}
```

---

## Orchestration Strategies

### Sequential (default)
Agent A finishes → Agent B starts
Use: Features com dependências claras

### Parallel (independent)
Agents A e B trabalham simultaneamente
Use: Frontend e Test podem rodar em paralelo

### Waterfall
Phase 1: All Database tasks
Phase 2: All Backend tasks
Phase 3: All Frontend tasks
Use: Large feature rollout

### Iterative
Multiple passes: build → test → refine
Use: UX-heavy features

---

## Task States

```
┌─────────────┐
│   PENDING   │ ─ Aguardando atribuição
└──────┬──────┘
       │
┌──────▼──────┐
│ IN_PROGRESS │ ─ Agent executando
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼───┐
│COMPLETE│ │BLOCKED│ ─ Aguardando resolução
└───────┘ └──────┘
```

---

## When Orchestrator intervenes directly

Orchestrator pode executar tasks simples sozinho (sem agente):

1. **Documentation updates** - read_file → apply_change em docs
2. **File moves/renames** - git mv + updates
3. **Merging PRs** - se trivial
4. **Log updates** - decisions_log.md, change_history.md
5. **Index updates** - index.json regeneration

---

## Escalation Path

```
Agent difficulty ──► Orchestrator reassign
      │
      └─► Still stuck ──► Architect intervention
                               │
                               └─► Major ADR needed ──► User consultation
```

---

## Example Scenarios

### Scenario 1: New Feature (simple)
```
Task: "Adicionar campo 'tags' em provas"

1. Orchestrator:
   - Check index.json (prova entity)
   - Decompõe:
     a) Migration: ADD COLUMN tags JSONB
     b) Model: add tags?: string[]
     c) Repository: include tags in select
     d) Frontend: tag input in form

2. Assign: Database → Backend → Frontend (sequential)

3. After each: run_lint, verify

4. Update memory: change_history.md

5. Report: ✅ Done
```

### Scenario 2: Bug Fix (urgent)
```
Task: "Corrigir erro 500 ao submeter prova sem questões"

1. Orchestrator:
   - Check known_issues.md (maybe already logged)
   - Assign to Backend immediately (P0)
   - Skip Database (no schema change)
   - Skip Frontend (backend fix sufficient)

2. Backend: debug, fix validation

3. Test agent: add regression test (optional, after)

4. Fast-track commit (hotfix)
```

### Scenario 3: Refactor (multi-agent)
```
Task: "Extrair service layer de repositories"

1. Architect approval required (structural change)

2. Orchestrator decomposes:
   - Create src/services/
   - Move business logic from repositories to services
   - Update injections
   - Update all callsites

3. Parallel assignment:
   - Architect: review design patterns
   - Backend-A: create service base
   - Backend-B: migrate ProvaService
   - Backend-C: migrate RespostaService
   - All: update repositories to use services

4. Integration: all must pass lint + tests

5. Architect final approval
```

---

## Safety & Compliance

### Rate Limiting
Orchestrator itself has skill usage limits (delegate to avoid exhaustion)

### Rollback Protocol
If task introduces breaking change:
1. Orchestrator runs `git revert <commit>`
2. Updates `known_issues.md`
3. Notifies all agents of regression

### Audit Trail
All orchestration decisions logged to `memory/decisions_log.md`:
```
[2025-04-18 22:45] Assigned task "add-duration-field" to Database agent
[2025-04-18 22:47] Database task completed
[2025-04-18 22:48] Assigned backend task (depends on DB)
[2025-04-18 23:01] Backend task completed, frontend assigned
[2025-04-18 23:15] All tasks done, feature shipped
```

---

## Metrics Tracked

- Task completion time avg
- Agent utilization (% busy)
- Failure rate per agent
- Memory usage (context tokens)

---

## Orchestrator Limitations

- Cannot override Architect decisions
- Cannot edit production code directly (delegates)
- Cannot approve own changes (needs Architect review)
- Cannot commit without quality gates

---

## Future Enhancements

- Auto-dependency resolution (detect circular deps)
- Predictive agent assignment (based on historical performance)
- Self-healing workflows (retry failed tasks with modified approach)
- Multi-threaded orchestration (parallel agents on independent tasks)

---

**Document Status**: V1.0 - Core orchestration logic defined
**Next**: Implement task scheduler and state machine

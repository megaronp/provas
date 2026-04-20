# Decision Log - ProvaSystem

This log records significant architectural and technical decisions made during the development of ProvaSystem.

---

## 2025-04-18: Agent System Architecture

**Decision**: Implement multi-agent autonomous development system with specialized agents.

**Status**: Accepted

**Context**:
- Project was monolithic with manual development
- Needed to scale development velocity
- Want reproducible, documented decisions

**Alternatives Considered**:
- Manual development only (rejected: too slow)
- Single AI agent doing everything (rejected: lack of specialization)
- Multi-agent but no memory (rejected: no traceability)

**Consequences**:
- Positive: Clear responsibilities, traceable decisions, parallel work
- Negative: Initial overhead, learning curve, coordination complexity

**Implementation**:
- Created `.agents/` folder structure
- Defined 5 agent roles + orchestrator
- Implemented skill-based tool system

**Agent Responsible**: Architect Agent

---

## 2025-04-18: Supabase Migration

**Decision**: Migrate from JSON file storage to Supabase PostgreSQL.

**Status**: Implemented ✓

**Context**:
- Original system stored provas and respostas in JSON files
- Filesystem not scalable, no transactions, no concurrent access
- Needed proper relational DB

**Alternatives Considered**:
- Continue with JSON + SQLite (rejected: still file-based)
- MongoDB (rejected: need relational joins)
- Firebase (rejected: vendor lock-in, cost)
- Supabase (accepted: open-source, Postgres, good free tier)

**Consequences**:
- Positive: ACID compliance, scalable, RLS security, realtime future
- Negative: Migration effort, external dependency, learning curve
- Migration scripts created in `supabase/migrations/`

**Implementation**:
- Created migration files for all tables: provas, questoes, alunos, submissoes, respostas
- Updated repositories to use Supabase client
- Removed all filesystem读写 code

**Agent Responsible**: Database Agent + Backend Agent

---

## 2025-04-18: TypeScript Strict Mode

**Decision**: Enable strict TypeScript configuration.

**Status**: Standard ✓

**Context**:
- Project started with loose TypeScript settings
- Typescript allows `any` by default (unsafe)

**Alternatives Considered**:
- Keep loose (rejected: quality suffers)
- Strict mode (accepted: catches errors early)

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

**Consequences**:
- Positive: Type safety, better IDE support, fewer runtime errors
- Negative: More verbose code, initial refactor needed

**Agent Responsible**: Architect Agent

---

## 2025-04-18: Repository Pattern

**Decision**: Use Repository pattern for all database access.

**Status**: Implemented ✓

**Context**:
- Backend code was mixing Express handlers with Supabase queries
- Hard to test, tightly coupled

**Pattern**:
```typescript
// Repositories hide DB implementation
export class ProvaRepository {
  async create(dados: ProvaCreate): Promise<Prova> { ... }
  async findById(id: number): Promise<Prova | null> { ... }
}

// Routes call repositories
router.post("/provas", async (req, res) => {
  const prova = await provaRepository.create(req.body);
  res.json(prova);
});
```

**Consequences**:
- Positive: Testable (mock repos), isolated business logic, swap DB easily
- Negative: Extra abstraction layer, more files

**Agent Responsible**: Architect Agent + Database Agent

---

## 2025-04-18: Vanilla JavaScript Frontend

**Decision**: No frontend framework (React/Vue) - use plain JS + Bootstrap.

**Status**: Standard ✓

**Context**:
- Project scope moderate (admin + student portals)
- Want to avoid build complexity
- Team familiar with vanilla JS

**Alternatives Considered**:
- React (rejected: overkill, build setup overhead)
- Vue (rejected: similar overhead)
- Alpine.js (considered but rejected: new dependency, limited benefit)
- Vanilla + Bootstrap (accepted)

**Consequences**:
- Positive: Simple, no transpilation, fast load, zero npm for frontend
- Negative: Manual DOM manipulation, no reactivity system

**Agent Responsible**: Architect Agent + Frontend Agent

---

## 2025-04-18: Google Sheets as Optional Integration

**Decision**: Keep Google Sheets integration as optional feature, not core dependency.

**Status**: Implemented ✓

**Context**:
- Initially Google Sheets was primary "database"
- Migration to Supabase removed hard dependency
- Some users may still want Sheets export

**Implementation**:
- `src/sheets/` folder (separate from core)
- Feature flag: only load if configured
- Falls back to CSV export

**Consequences**:
- Positive: Core system independent, optional value-add
- Negative: Extra code maintenance, API key security

**Agent Responsible**: Backend Agent

---

## 2025-04-18: JSON API Envelope Standard

**Decision**: All API responses wrap in `{ success, data, error }` envelope.

**Status**: Standard ✓

**Context**:
- Direct data returns make error handling inconsistent
- Need uniform format for frontend consumption

**Format**:
```json
{ "success": true, "data": { ... }, "message": "OK" }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

**Consequences**:
- Positive: Consistent parsing, easy error handling on frontend
- Negative: Slightly more verbose payloads

**Agent Responsible**: Backend Agent (defined) + Architect (approved)

---

## 2025-04-18: Error Handling Strategy

**Decision**: Centralized Express error middleware with custom error classes.

**Status**: Implemented ✓

**Strategy**:
```typescript
class ValidationError extends Error { /*...*/ }
class NotFoundError extends Error { /*...*/ }
class ConflictError extends Error { /*...*/ }

app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: err.message } });
  }
  // ... more
});
```

**Consequences**:
- Positive: Consistent error format, easy debugging
- Negative: Requires discipline to throw correct error types

**Agent Responsible**: Backend Agent

---

## 2025-04-19: Authentication Future Planning

**Decision**: Defer authentication implementation to future milestone.

**Status**: Deferred ⏸️

**Context**:
- Current version assumes single admin (hardcoded)
- Student access via simple identificacao field
- Need proper auth (login/password) for v2.0

**Rationale**:
- Focus on core functionality first
- Auth is significant scope (OAuth, sessions, password reset)
- Can add as separate module later

**Implementation Plan (future)**:
- Supabase Auth integration
- JWT tokens
- Role-based access (admin/student)

**Agent Responsible**: Architect (to design) + Backend (to implement later)

---

## 2026-04-19: Fórmula de Cálculo - Múltipla Escolha

**Decision**: Atualizar fórmula de cálculo para questões de múltipla escolha.

**Status**: Implementada ✓

**Contexto**:
- Fórmula anterior tinha penalização por marcação errada
- Necessário ajustar para sistema onde aluno não perde ponto, apenas deixa de ganhar

**Nova Lógica**:
- Cada opção vale: valor_da_questão / número_de_opções
- +1 ponto para cada opção CORRETA MARCADA
- +1 ponto para cada opção ERRADA NÃO MARCADA
- 0 ponto para opção ERRADA MARCADA ou CORRETA NÃO MARCADA
- Mínimo: 0 pontos

**Exemplo (4 opções A,B,C,D - B,C corretas, valor=4):**
- Marcou só B → 1+2 = 3 pontos
- Marcou A,B → 1+1 = 2 pontos
- Marcou todas → 2+0 = 2 pontos
- Não marcou → 0+2 = 2 pontos

**Arquivo Alterado**: `src/correction/corrector.ts` - função `corrigirMultipla()`

**Agent Responsible**: Backend Agent

---

## 2026-04-19: Funcionalidades de Gestão de Submissões no Relatório

**Decision**: Adicionar opções de recalcular e excluir submissões na tela de relatório.

**Status**: Implementada ✓

**Contexto**:
- Necessidade de permitir correção manual de notas após alteração das fórmulas
- Possibilidade de remover submissões inválidas ou duplicadas

**Implementação**:
- Endpoint POST `/admin/submissao/:id/recalcular` - Recalcula nota usando fórmulas atuais
- Endpoint DELETE `/admin/submissao/:id` - Remove submissão e suas respostas
- Interface: ícones de recalcular (seta) e excluir (lixeira) na tabela de resultados

**Exemplo de uso**:
- Após ajuste nas fórmulas de cálculo, admin pode recalcular notas de submissões existentes
- Submissões duplicadas ou inválidas podem ser removidas

**Arquivos Alterados**:
- `src/admin/adminRoutes.ts`
- `src/db/respostaRepository.ts`
- `public/admin/relatorio.html`

**Agent Responsible**: Backend Agent

---

## [Future] Decisions

### To Be Documented:
- Real-time subscriptions adoption
- Multi-tenant support (RLS policies)
- Export formats (PDF, Excel beyond CSV)
- Mobile app considerations (PWA?)
- Audit logging strategy

---

**Document Maintenance**:
- New significant decisions → add entry at TOP
- Status: Proposed → Accepted → Implemented → Deprecated

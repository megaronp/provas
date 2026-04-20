# Known Issues - ProvaSystem

List of known issues, bugs, technical debt, and areas needing improvement.

---

## High Priority (Production Impact)

### ❌ No Authentication System
**Severity**: Critical
**Status**: Known
**Impact**: Admin panel unprotected, any user can access

**Details**:
- Currently only basic session check (if any)
- Need proper login/password
- Student portal has no auth (only `identificacao` field)

**Owner**: Architect (design) → Backend (implement)
**ETA**: Milestone 2.0

---

### ❌ N+1 Query Problem in ProvaRepository
**Severity**: Critical (Performance)
**Status**: Known
**Impact**: Response time escala O(N) - cada prova faz +2 queries

**Affected Code**:
- `listarTodasProvas()` (linhas 18-33): para cada prova P, chama:
  - `listarQuestoes(P.id)` → 1 query
  - `listarCamposAluno(P.id)` → 1 query
  - **Total**: 1 + 2*N queries (N=20 provas → 41 queries!)

**Current Behavior**:
```typescript
const provas = await supabase.from('provas').select('*'); // 1 query
const provasCompletas = await Promise.all(
  provas.map(async p => {
    const questoes = await listarQuestoes(p.id);      // N queries
    const campos = await listarCamposAluno(p.id);     // N queries
    return { ...p, questoes, campos };
  })
);
```

**Proposed Fix**: Single query with JOINs
```sql
SELECT 
  p.*,
  q.*,        -- questões (array agg)
  c.*         -- campos_aluno (array agg)
FROM provas p
LEFT JOIN questoes q ON q.prova_id = p.id
LEFT JOIN campos_aluno c ON c.prova_id = p.id
WHERE p.id = ?
GROUP BY p.id;
```
Ou, no Supabase JS:
```typescript
const { data } = await supabase
  .from('provas')
  .select(`
    *,
    questoes (*),
    campos_aluno (*)
  `);
```

**Owner**: Database agent (migration/query design) + Backend agent (implement)
**ETA**: Sprint 1 (urgent)

---

### ❌ N+1 Query in Resultados/Reports
**Severity**: Critical
**Impact**: Relatórios com 100 submissões → 101+ queries

**Code**:
- `buscarResultadosPorProva()` (respostaRepository.ts:69-109): 1 query principal + N chamadas a `corrigirSubmissao()` (que busca cada questão individualmente)
- `buscarResultadoCompletoPorSubmissao()` (linhas 111-151): 2 queries (submissão + prova) por submissão

**Fix**: 
- Materializar notas na tabela `submissoes` (já tem `nota_total`, mas não por questão)
- Adicionar coluna `resultados_aggregated JSONB` ou calcular em batch
- Fazer JOINs únicos, não loops

**Owner**: Database + Backend
**ETA**: Sprint 1

---

### ❌ Missing Database Indexes
**Severity**: Critical (Performance degradation with scale)
**Status**: Known
**Impact**: Queries full table scans, não usam indexes

**Missing Indexes** (based on query patterns):

| Tabela | Coluna(s) | Razão |
|--------|-----------|-------|
| `provas` | `ativa` + `data_inicio` + `data_fim` | Filter ativas no período |
| `questoes` | `prova_id` | JOIN/FK (sempre usado) |
| `campos_aluno` | `prova_id` + `ordem` | JOIN + ORDER BY |
| `submissoes` | `prova_id` + `created_at` | Relatórios por prova |
| `submissoes` | `aluno_id` | Histórico do aluno |
| `respostas` | `submissao_id` | JOIN para buscar respostas |
| `respostas` | `questao_id` | Aggregates por questão |

**Action**: Database agent criar migration `CREATE INDEX` para todas as FKs e colunas filtradas.

**Owner**: Database Agent
**ETA**: Sprint 1

---

### ❌ Mixed Storage: Supabase + Filesystem
**Severity**: High (Consistency & Performance)
**Impact**: Estado persistido em dois lugares, I/O bloqueante, race conditions

**Problem Areas**:
1. `adminRoutes.ts` linhas 27-29: `PROVA_ATIVA_PATH` armazena ID da prova ativa em `data/prova_ativa.json`
   - Leitura/escrita síncrona com `fs.readFileSync`/`fs.writeFileSync` (bloqueante)
   - Pode causar race conditions em múltiplas requisições

2. `adminRoutes.ts` linhas 54-81: Config API lê/escreve mesmo arquivo JSON para `googleCredentials`

3. `adminRoutes.ts` linha 175: `salvarProvaAtivaPointer()` escreve no disco

**Why this is bad**:
- **I/O Bloqueante**: Node.js event loop bloqueado durante disco síncrono
- **Inconsistência**: Supabase é source of truth, mas estado ativo está arquivo morto
- **Scalabilidade**: Não funciona em cluster (cada instância tem estado local diferente)

**Proposed Fix**: Migrar `prova_ativa` para Supabase:
- Adicionar coluna `ativa` na tabela `provas` (já existe!)
- Garantir apenas 1 prova ativa via constraint única parcial:
  ```sql
  CREATE UNIQUE INDEX idx_unique_ativa ON provas(ativa) WHERE ativa = true;
  ```
- Remover todos os acessos a `PROVA_ATIVA_PATH` e `data/` directory
- Usar Supabase para configuração also (mover googleCredentials para tabela `config`)

**Owner**: Architect (design) → Database (migration) → Backend (remove fs code) → Frontend (if needed)
**ETA**: Milestone 1.5

---

## Medium Priority (User Experience)

### ⚠️ No Pagination on Lists
**Severity**: Medium
**Status**: Known
**Severity**: High
**Status**: Known
**Impact**: API vulnerable to brute force / DoS

**Details**:
- No limit on login attempts
- No limit on submission POST
- Could spam submissions

**Solution**: Implement express-rate-limit per IP/route
**Owner**: Backend Agent
**ETA**: Milestone 1.1

---

### ❌ Hardcoded CORS Origins
**Severity**: Medium
**Status**: Known
**Impact**: Deployment to new domain requires code change

**Details**:
- `src/config/cors.ts` has hardcoded localhost URLs
- Should use `process.env.CORS_ORIGIN` (already exists) but not used everywhere

**Fix**: Refactor CORS config to use env var consistently
**Owner**: Backend Agent
**ETA**: Sprint 2

---

## Medium Priority (User Experience)

### ⚠️ No Pagination on Lists
**Severity**: Medium
**Status**: Known
**Impact**: Performance degrades with many provas/alunos

**Details**:
- `GET /api/admin/provas` returns ALL records
- Should paginate (page/limit)

**Fix**:
- Add `?page=1&limit=20` query parameters
- Update repositories with `range()` queries
- Frontend: add pagination UI

**Owner**: Backend (API) + Frontend (UI)
**ETA**: Milestone 1.2

---

### ⚠️ No Email Notifications
**Severity**: Low-Medium
**Status**: Known
**Impact**: Students don't know when prova opens/closes/results ready

**Details**:
- Silent submissions
- No reminder before deadline

**Solution**: Integrate email (Resend/SendGrid/Mailgun)
**Owner**: Backend Agent + Orchestrator (evaluate service)
**ETA**: Milestone 2.0

---

### ⚠️ Reports Lack Export Options
**Severity**: Low
**Status**: Known
**Impact**: Admins want PDF/Excel, not just JSON/HTML

**Details**:
- Current export is only CSV (if at all)
- No PDF generation
- No chart images

**Solution**: Add pdfmake or jspdf library
**Owner**: Backend Agent
**ETA**: Milestone 2.1

---

## Technical Debt

### 🔄 Error Handling Inconsistent
**Severity**: Medium
**Category**: Code Quality
**Details**:
- Some routes use try-catch, others don't
- Error responses vary (some use `error` key, others plain message)

**Refactor**:
- Standardize on `{ success, error: { code, message, details } }`
- Add centralized validation middleware
- Document in `CONVENTIONS.md`

**Owner**: Backend Agent

---

### 🔄 Magic Strings Everywhere
**Severity**: Low
**Category**: Maintainability
**Details**:
- Status strings "draft", "active", "closed" scattered
- Tipo strings "multipla_escolha" repeated

**Fix**:
```typescript
export const STATUS = { DRAFT: "draft", ACTIVE: "active", CLOSED: "closed" } as const;
```

**Owner**: Backend Agent

---

### 🔄 No Input Sanitization
**Severity**: Low-Medium
**Category**: Security
**Details**:
- User input passed directly to DB (Supabase escapes, but still)
- XSS risk in frontend display (if user inputs HTML)

**Fix**:
- Sanitize on output (DOMPurify on frontend)
- Validate + escape on backend

**Owner**: Backend + Frontend

---

### 🔄 Supabase Client Created Multiple Times
**Severity**: Low
**Category**: Performance
**Details**:
- `supabaseClient.ts` creates singleton, but imported multiple times
- Could cause unnecessary instantiations

**Fix**: Verify singleton pattern, lazy load
**Owner**: Backend Agent

---

## Performance Concerns

### ⏳ Slow Reports with Many Submissions
**Severity**: Medium (future)
**Trigger**: >10,000 submissions
**Impact**: Admin reports page loads >5s

**Root cause**:
- Query calculates stats across entire `respostas` table
- No indexes on `submissao_id` or aggregated date ranges

**Proposed fix**:
- Add materialized view for stats
- Refresh nightly
- Add index on `respostas.created_at`

**Owner**: Database Agent + Backend Agent

---

## Missing Features

### 🔮 Audit Log
**Feature**: Track who changed what and when
**Importance**: High (compliance)
**Current state**: No tracking of admin actions

**Proposed**: Create `audit_logs` table with `user_id`, `action`, `entity`, `entity_id`, `before/after`, `timestamp`
**Owner**: Database + Backend

---

### 🔮 Multi-Tenant Support
**Feature**: Multiple schools on same instance
**Importance**: Medium (SaaS potential)
**Current state**: Single tenant (no isolation)

**Proposed**: Add `tenant_id` to all tables, enable RLS per tenant
**Owner**: Architect (design) + Database (schema)

---

### 🔮 Real-time Notifications
**Feature**: Push notifications to admin when new submission
**Importance**: Low
**Current state**: Polling only (manual refresh)

**Proposed**: Supabase Realtime subscriptions → WebSocket
**Owner**: Backend + Frontend

---

## Frontend Issues

### 🎨 Inconsistent UI States
**Issue**: Disabled buttons not clearly shown
**Page**: Admin forms
**Fix**: Add `:disabled` CSS styles for all buttons
**Owner**: Frontend Agent

---

### 📱 Mobile Tables Overflow
**Issue**: Tables overflow container on mobile < 576px
**Page**: Admin list pages
**Fix**: Wrap tables in `.table-responsive`
**Owner**: Frontend Agent

---

### 🔄 No Loading Skeletons
**Issue**: Blank page while data loads
**Fix**: Add skeleton screens for initial load
**Owner**: Frontend Agent

---

## Database Issues

### 📊 Missing Indexes
**Table**: `respostas`
**Missing**: Index on `submissao_id` (foreign key)
**Impact**: Slow joins with submissoes
**Action**: `CREATE INDEX idx_respostas_submissao ON respostas(submissao_id);`
**Owner**: Database Agent

---

### 🔗 FK Constraints Missing?
**Check**: Are all FKs properly declared?
**Finding**: Some FKs might be missing `ON DELETE` behavior
**Action**: Review all FOREIGN KEY constraints, document in schema
**Owner**: Database Agent

---

## Security

### 🔐 No CSRF Protection
**Risk**: Medium
**Details**: State-changing POST/DELETE/PUT vulnerable to CSRF
**Fix**: Implement CSRF tokens (or SameSite cookies when auth added)
**Owner**: Backend Agent

---

### 🔐 Secrets in `.env` Accidental Commit
**Risk**: High
**Mitigation**: `.gitignore` has `.env`, but double-check no `.env.*` committed
**Action**: Scan repository history
**Owner**: All agents (vigilance)

---

## Testing

### 🧪 No Automated Tests
**Status**: 0% coverage
**Impact**: Regression risk
**Owner**: Test Agent (create test suite)

---

### 🧪 Manual Testing Exhausting
**Issue**: Every change requires manual test of all flows
**Solution**: Automate e2e tests with Playwright
**Owner**: Test Agent

---

## Documentation

### 📝 Missing API Docs
**Issue**: No OpenAPI/Swagger spec
**Solution**: Auto-generate from JSDoc/TypeScript types
**Owner**: Architect + Backend

---

### 📝 No Deployment Guide
**Issue**: `README.md` minimal
**Solution**: Write `docs/deployment.md`, `docs/development.md`
**Owner**: Architect

---

## Wishlist (Nice to Have)

- Dark mode toggle
- Dashboard with charts (Chart.js)
- Bulk upload of questions (CSV)
- Question bank (reuse across provas)
- Student rankings/leaderboard
- Email integration for results
- Mobile app (React Native)
- Prova timer (countdown)
- Question randomization per student
- Plagiarism detection for dissertativas

---

## Status Legend

- ❌ = Broken / Missing (critical)
- ⚠️ = Suboptimal but works
- 🔄 = Needs refactoring
- 🔐 = Security concern
- 🎨 = UI/UX polish
- 🧪 = Testing gap
- 📝 = Documentation gap
- 🔮 = Future feature

---

**Last updated**: 2025-04-18 (initial agent setup)
**Next review**: After first feature cycle completed

# Architecture - ProvaSystem

## Architectural Decisions (ADRs)

### ADR-001: Supabase as Primary Database
**Status**: ✅ Implementado
**Decisão**: Migrar de arquivos JSON para Supabase (PostgreSQL)
**Motivação**:
- Persistência confiável e escalável
- Row Level Security (RLS) para segurança
- Realtime subscriptions (futuro)
- Schema versionado via migrations

**Consequências**:
- Removida dependência obrigatória de Google Sheets
- Requer configuração de variável `SUPABASE_URL` e `SUPABASE_KEY`
- Migration scripts necessários para deploy

---

### ADR-002: TypeScript End-to-End
**Status**: ✅ Implementado
**Decisão**: Usar TypeScript no backend e frontend (com transpilação)
**Motivação**:
- Type safety catching erros em tempo de desenvolvimento
- Melhor IDE support e autocomplete
- Manutenibilidade a longo prazo

**Consequências**:
- Build step necessário (tsc)
- Node.js 18+ requerido
- Tipos compartilhados entre frontend/backend via `src/models/`

---

### ADR-003: Repository Pattern for Data Access
**Status**: ✅ Implementado
**Decisão**: Camada de repositório abstraindo Supabase client
**Motivação**:
- Isolamento de lógica de negócio de queries
- Facilita troca de banco no futuro
- Testabilidade (mock de repositórios)

**Implementação**:
- `src/db/provaRepository.ts` - operações de provas
- `src/db/respostaRepository.ts` - operações de respostas/submissões
- `src/db/supabaseClient.ts` - cliente singleton

---

### ADR-004: RESTful API with Express
**Status**: ✅ Implementado
**Decisão**: API REST tradicional em vez de GraphQL
**Motivação**:
- Simplicidade e familiaridade da stack
- Frontend vanilla não requer bibliotecas complexas
- Fácil cache e versionamento

**Convenções**:
- Rotas agrupadas por domínio (`/api/admin/`, `/api/student/`)
- HTTP status codes apropriados
- JSON como formato único

---

### ADR-005: Frontend-Backend Separation
**Status**: ✅ Implementado
**Decisão**: Frontend e backend em pastas separadas (`public/` vs `src/`)
**Motivação**:
- Deploy independente possível
- Claro ownership das responsabilidades
- Facilita testes E2E

**Comunicação**:
- `fetch()` API nativa
- Formato JSON padronizado
- Error handling centralizado

---

### ADR-006: Bootstrap 5 UI Framework
**Status**: ✅ Implementado
**Decisão**: Bootstrap 5 para estilização rápida
**Motivação**:
- Prototipagem rápida
- Responsividade pronta
- Componentes prontos (modais, forms, tables)

**Customização**:
- CSS custom em `public/*/css/`
- Bootstrap via CDN (sem bundler)
- Future possibility: migrar para Tailwind

---

## Performance & Scalability ADRs

### ADR-007: Eliminate Filesystem State, Use Supabase Only
**Status**: 🟡 Proposed (pending approval)
**Decisão**: Remover todos os arquivos JSON locais (`data/`, `prova_ativa.json`) e usar apenas Supabase para estado persistente.

**Motivação**:
- Performance: I/O síncrono bloqueia event loop (fs.readFileSync/writeFileSync)
- Consistência: Estado ativo deve estar em mesma fonte de dados (Supabase)
- Escalabilidade: Em cluster/multiple instances, arquivos locais divergem
- Simplicidade: Menos camadas, menos código

**Problemas Atuais**:
- `src/admin/adminRoutes.ts` linhas 27-29 e 54-81: `PROVA_ATIVA_PATH` + `googleCredentials` armazenados em JSON local
- `src/server.ts` linhas 17-20: criação de diretórios `data/` e `provas/`
- Leitura/escrita síncrona em cada request → bloqueia event loop

**Implementação**:
1. **Migrate prova ativa tracking**:
   - Criar migration: garantir apenas 1 prova ativa via unique partial index:
     ```sql
     CREATE UNIQUE INDEX idx_unique_prova_ativa ON provas(ativa) WHERE ativa = true;
     ```
   - Garantir application logic: ao "selecionar" prova, desativa todas as outras em transação
   - Remover `PROVA_ATIVA_PATH`, `salvarProvaAtivaPointer()`, `getProvaAtivaId()` de `adminRoutes.ts`

2. **Migrate Google credentials** (optional):
   - Criar tabela `config (key VARCHAR PK, value JSONB)`
   - Mover credenciais para `INSERT INTO config VALUES ('google_credentials', '...')`
   - Remover leitura/escrita de arquivo

3. **Server cleanup**:
   - Remover criação de diretórios `data/` e `provas/` em `server.ts`
   - Remover `import * as fs` de `adminRoutes.ts`

**Consequências**:
- ✅ Redução de I/O bloqueante → +100 req/s capacidade
- ✅ Estado consistente em todas instâncias (load balancer)
- ✅ Menos código (remove ~50 linhas)
- ❌ Requer migration antes de deploy
- ⚠️ Google Sheets pode precisar re-autenticar se credentials migradas

**Rollback**: Reverter migration + restore filesystem code (não recomendado)

**Owner**: Database (migration) → Backend (code removal) → Architect (approval)
**ETA**: Sprint 1

---

### ADR-008: Introduce Database Indexing Strategy
**Status**: 🟡 Proposed
**Decisão**: Adicionar índices em todas as foreign keys e colunas de filtro/order.

**Motivação**:
Queries atuais não usam índices, causando sequential scans. Com crescimento (10k+ submissões), relatórios ficam lentos (2s+).

**Índices Propostos**:

```sql
-- ── Foreign Keys (sempre) ───────────────────────────────────────────────────
CREATE INDEX idx_questoes_prova_id ON questoes(prova_id);
CREATE INDEX idx_campos_aluno_prova_id ON campos_aluno(prova_id);
CREATE INDEX idx_submissoes_prova_id ON submissoes(prova_id);
CREATE INDEX idx_submissoes_aluno_id ON submissoes(aluno_id);
CREATE INDEX idx_respostas_submissao_id ON respostas(submissao_id);
CREATE INDEX idx_respostas_questao_id ON respostas(questao_id);

-- ── Filtros frequentes ──────────────────────────────────────────────────────
-- Provas ativas (usado em GET /api/student/provas-disponiveis)
CREATE INDEX idx_provas_ativa_periodo ON provas(ativa, data_inicio, data_fim)
  WHERE ativa = true AND data_inicio <= NOW() AND data_fim >= NOW();

-- Submissões por prova (relatórios)
CREATE INDEX idx_submissoes_prova_created ON submissoes(prova_id, created_at DESC);

-- Submissões por aluno (histórico)
CREATE INDEX idx_submissoes_aluno_created ON submissoes(aluno_id, created_at DESC);

-- Ordenações comuns
CREATE INDEX idx_provas_created_at ON provas(created_at DESC);
CREATE INDEX idx_questoes_prova_ordem ON questoes(prova_id, ordem ASC);
```

**Validation**:
- Executar `EXPLAIN ANALYZE` antes/depois em queries críticas
- Teste com 10k submissões simuladas (Database agent)

**Owner**: Database Agent
**ETA**: Sprint 1 (blocking para outras otimizações)

---

### ADR-009: Fix N+1 Query Problem with Eager Loading
**Status**: 🟡 Proposed
**Decisão**: Usar Supabase `select()` com relacionamentos aninhados em vez de queries paralelizadas (Promise.all).

**Problema Detalhado**:

#### Issue 1: `listarTodasProvas()` (provaRepository.ts:9-36)
```typescript
// ANTES (N+1 - 1 + 2N queries):
const provas = await supabase.from('provas').select('*'); // 1 query
const provasCompletas = await Promise.all(
  provas.map(async p => {
    const questoes = await listarQuestoes(p.id);      // N queries
    const campos = await listarCamposAluno(p.id);     // N queries
    return { ...p, questoes, campos };
  })
);
// N=20 → 41 queries, ~500ms+

// DEPOIS (1 query):
const { data } = await supabase
  .from('provas')
  .select(`
    *,
    questoes (*),
    campos_aluno (*)
  `)
  .order('created_at', { ascending: false });
// 1 query, ~50ms
```

#### Issue 2: `buscarProvaPorId()` (linhas 38-61)
Mesmo padrão N+1. Transformar em single JOIN query.

**Solução**: Supabase relacionamentos foreign key automação:
```typescript
// Se foreign keys declaradas no schema, Supabase permite:
.select(`
  *,
  questoes ( * ),
  campos_aluno ( * )
`)
```

**Verificar**: Supabase dashboard → Table relationships configured?

**Aplicar em**:
- [x] `listarTodasProvas()` → JOIN
- [x] `buscarProvaPorId()` → JOIN
- [x] `buscarProvaAtiva()` → JOIN

**Nota**: `buscarResultadosPorProva()` já usa JOIN aninhado (linhas 69-109), mas verificar se está gerando N+1 internamente (parece OK).

**Implementation**:
1. Database agent: garantir FKs no schema
2. Backend agent: reescrever métodos do repositório
3. Test agent: validar que retorno ainda compatível

**Owner**: Backend Agent (com consulta Database)
**ETA**: Sprint 1

---

### ADR-010: Asynchronous Google Sheets Backup
**Status**: 🟡 Proposed
**Decisão**: Desacoplar Sheets backup da response da submissão (fire-and-forget ou fila).

**Problema**:
`studentRoutes.ts` linha 104-112:
```typescript
await salvarResultadoNaSheet(...);  // Síncrono, bloqueia response
res.json(resultado);
```
Google Sheets API pode demorar 500ms-2s → aluno experienced delay desnecessário.

**Solução**: Tornar assíncrono (fire-and-forget com error logging):
```typescript
// Disparar sem await, resposta volta imediatamente
salvarResultadoNaSheet(sheetId, prova, resultado, submissao)
  .catch(err => console.error('[Sheets backup failed]', err));

res.json(resultado);  // Imediato
```

**Trade-offs**:
- ✅ UX instantâneo
- ❌ Perda de dados se Sheets falhar (não crítico, é backup)
- ✅ Simples (sem infra de fila)

**Future**: Implementar fila confiável (Bull/Redis) com retry.

**Owner**: Backend Agent
**ETA**: Sprint 1

---

### ADR-011: Pagination for Large Lists
**Status**: 🟡 Proposed
**Decisão**: Implementar cursor-based pagination em listas que retornam collection completa.

**Motivo**:
`listarTodasProvas()` retorna TODAS as provas (sem paginação). Com 1000+ provas:
- Payload enorme (megabytes)
- Lento no frontend (render)
- Consome memória

**Pagination Pattern** (cursor-based, mais eficiente que offset):
```
GET /api/admin/provas?limit=20&after=last_seen_id
```
- `limit`: page size (default 20, max 100)
- `after`: cursor (ID da última prova da página anterior)

**Implementation**:
```typescript
// Supabase cursor-based:
const { data } = await supabase
  .from('provas')
  .select('*')
  .gt('id', cursor)           // greater than
  .limit(limit + 1)           // fetch extra to detect hasNext
  .order('id', { ascending: true });

const hasNext = data.length > limit;
const page = data.slice(0, limit);
```

**Apply to**:
- `GET /api/admin/provas` (adminRoutes.ts:85-92)
- `GET /api/admin/relatorios` (future)
- `GET /api/student/historico` (future)

**Owner**: Backend Agent
**ETA**: Sprint 2 (after P0 fixes)

---

### ADR-012: Batch Inserts in salvarSubmissao
**Status**: 🟡 Proposed
**Decisão**: Otimizar `salvarSubmissao()` usando transação e inserts em batch.

**Currently** (respostaRepository.ts:7-33):
```typescript
// 1. Insert submissao (1 query)
await supabase.from('submissoes').insert(...).select().single();
// 2. Insert respostas - batch, but no transaction
await supabase.from('respostas').insert(respostasRows);
```

**Issues**:
- Sem transação → se insert de respostas falhar, submissão fica órfã (INCONSISTÊNCIA!)
- Pode melhorar performance com RPC (stored procedure)

**Fix**:
```typescript
// Option 1: Use Supabase transaction (RPC)
await supabase.rpc('salvar_submissao_completa', {
  p_submissao: submissao,
  p_respostas: respostasRows
});

// Option 2: Client-side transaction (if supported)
// Supabase doesn't have client transaction, use RPC or multiple calls with rollback logic
```

**Migration**: Criar função SQL `salvar_submissao_completa`:
```sql
CREATE OR REPLACE FUNCTION salvar_submissao_completa(
  p_id UUID, p_prova_id UUID, p_aluno_dados JSONB, p_respostas JSONB[]
) RETURNS submissoes AS $$
DECLARE
  v_submissao submissoes;
BEGIN
  INSERT INTO submissoes (id, prova_id, aluno_dados, nota_total, nota_maxima)
  VALUES (p_id, p_prova_id, p_aluno_dados, 0, 0)
  RETURNING * INTO v_submissao;

  INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados)
  SELECT uuid_generate_v4(), v_submissao.id, r->>'questao_id', r->>'tipo', r->'dados'
  FROM unnest(p_respostas) AS r;

  RETURN v_submissao;
END;
$$ LANGUAGE plpgsql;
```

**Owner**: Database (RPC function) + Backend (call)
**ETA**: Sprint 1

---

### ADR-013: Materialized Views for Reports (Phase 2)
**Status**: 💡 Idea (future)
**Decisão**: Pré-agregar estatísticas de relatórios em tabela/materialized view para evitar recalcular a cada request.

**Current**:
`calcularRelatorio()` (reportService.ts:56-101) percorre todas submissões em memória:
```typescript
const mediaGeral = resultados.reduce((a, r) => a + r.notaTotal, 0) / total;
// O(N) por request
```

**With 10k submissões**: loop 10k vezes a cada request do relatório → lento.

**Solution**:
- Criar tabela `relatorio_prova_cache`:
  ```sql
  CREATE TABLE relatorio_prova_cache (
    prova_id UUID PRIMARY KEY,
    total_alunos INTEGER,
    media_geral NUMERIC(5,2),
    updated_at TIMESTAMPTZ
  );
  ```
- Atualizar via trigger após INSERT/UPDATE em `respostas` (ou batch nightly)
- Relatório lê dessa tabela (O(1))

**Owner**: Database + Backend
**ETA**: Milestone 2.0

---


## System Architecture Diagram (Updated - Textual)

```
┌─────────────────────────────────────────────┐
│        Frontend (Browser)                  │
│  Admin Panel  │  Student Portal            │
└────────┬──────────────┬─────────────────────┘
         │ fetch()      │ fetch()
         ▼               ▼
┌─────────────────────────────────────────────┐
│         Backend (Express)                  │
│  ┌────────────────────────────────────────┐ │
│  │ Routes (adminRoutes, studentRoutes)    │ │
│  │ - I/O-blocking filesystem REMOVED ✅    │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │ Repository Layer (Eager Loading)       │ │
│  │ - JOINs replace N+1 queries ✅          │ │
│  │ - Cache layer (future)                 │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │  Supabase (PostgreSQL)                 │ │
│  │ - Indexes added ✅                      │ │
│  │ - Unique constraint ativa=true ✅       │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Async Workers (future):
- Sheets backup worker (queues)
- Report calculation worker (pre-aggregation)
```

---

## Performance Benchmarks (Targets)

| Operation | Current (estimated) | Target (after P0 fixes) | Target (phase 2) |
|-----------|---------------------|------------------------|------------------|
| Listar todas provas (N=20) | ~500ms (41 queries) | ~50ms (1 query JOIN) | ~10ms (cache) |
| Buscar prova ativa | ~150ms (2 queries + I/O) | ~20ms (1 query) | ~5ms (cache) |
| Relatório (100 submissões) | ~2000ms (N+1 calculations) | ~300ms (batch calc) | ~50ms (materialized) |
| Submeter prova (com Sheets) | ~800ms | ~200ms (async Sheets) | ~150ms (queued) |

---

## Migration Order (Priority)

### P0 - Critical Path (Sprint 1)
1. **ADR-008**: Fix N+1 in `listarTodasProvas()` and `buscarProvaPorId()`
2. **ADR-007**: Add all missing indexes (database migration)
3. **ADR-006**: Eliminate filesystem state (remove `data/` dir usage)
4. **ADR-012**: Batch insert with transaction for `salvarSubmissao()`

### P1 - High Impact (Sprint 2)
5. **ADR-010**: Async Sheets backup (fire-and-forget)
6. **ADR-011**: Pagination for lists
7. **ADR-009**: In-memory cache for prova ativa (node-cache)

### P2 - Medium (Milestone 2.0)
8. **ADR-013**: Materialized views for reports
9. Redis cache → distributed cache for multi-instance
10. Query result caching with TTL

---

## How to Proceed

**Step 1 (Immediate)**: Assign Database agent to create migration for indexes (ADR-007).

**Step 2**: Assign Backend agent to refactor `listarTodasProvas()` using JOINs (ADR-008).

**Step 3**: Backend agent removes all filesystem I/O from `adminRoutes.ts` (ADR-006).

**Step 4**: Database agent creates RPC function `salvar_submissao_completa()` (ADR-012).

**Step 5**: Backend agent updates `salvarSubmissao()` to use RPC + async Sheets (ADR-010).

**Verification**: After each step, run tests, measure query count with Supabase logs.

---

**Document Status**: V1.1 - Performance issues identified, 5 new ADRs proposed (007-013 P0-P2)
**Next Review**: After P0 implementation complete (Sprint 1 review)

## System Architecture Diagram (Textual)

```
┌─────────────────────────────────────────┐
│         Frontend (Browser)              │
│  ┌─────────────┐    ┌─────────────┐     │
│  │ Admin Panel │    │ Student UI  │     │
│  └─────────────┘    └─────────────┘     │
└────────────┬─────────────────┬─────────┘
             │ fetch() API     │ fetch() API
             ▼                 ▼
┌─────────────────────────────────────────┐
│         Backend (Express)               │
│  ┌───────────────────────────────────┐  │
│  │  Routes Layer                     │  │
│  │  /api/admin/* | /api/student/*   │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Business Logic (Controllers)     │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Repository Layer                 │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Supabase Client (PostgreSQL)     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Data Flow Examples

### Criar Nova Prova (Admin)
1. Admin envia POST `/api/admin/provas` com dados da prova + questões
2. Rota valida payload (Joi/Zod)
3. `provaRepository.create(provaData)` cria registro em `provas`
4. Para cada questão, `questaoRepository.create()` com `prova_id`
5. Retorna 201 Created com prova completa

### Aluno Submete Prova
1. Aluno GET `/api/student/provas/disponiveis` lista provas ativas
2. Aluno POST `/api/student/provas/:id/submeter` envia respostas
3. Valida se prova está no período e se aluno já não submeteu
4. Cria `submissao` e múltiplas `respostas`
5. Correção automática para questões objetivas
6. Retorna 201 Created com confirmação

### Relatório Admin
1. Admin GET `/api/admin/relatorios?prova_id=X`
2. Busca todas submissions da prova
3. Calcula estatísticas (média, acertos por questão)
4. Retorna JSON aggregate

## Security Considerations

### Implementado
- Validação de entrada em todas as rotas
- Verificação de períodos de prova (data_inicio/fim)
- Isolamento por tenant (futuro: multi-tenant via RLS)
- Senhas hasheadas (supabase.auth)

### Pendente (Backlog)
- Rate limiting por IP/aluno
- Audit log para ações administrativas
- Backup automatizado diário
- Criptografia de dados sensíveis

## Performance Considerations
- Queries indexadas no Supabase (primary keys, foreign keys)
- Paginação em listas longas
- Frontend: carga inicial leve (~100KB)
- Cache de provas disponíveis (5min)

## Scalability Pathway
1. **Fase 1**: Otimizar queries existentes + índices
2. **Fase 2**: Implementar Redis cache para sessões/provas
3. **Fase 3**: Microserviços (avaliação, notificações)
4. **Fase 4**: CDN para assets estáticos

## Error Handling Strategy
- Try-catch em todas as routes assíncronas
- Error middleware centralizado ( Express error handler)
- Logging estruturado (JSON para futura integração com Sentry)
- Frontend: mensagens amigáveis, logs no console

## Deployment Architecture
- **Ambiente**: Ubuntu 22.04 LTS
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Database**: Supabase Cloud (managed)
- **Envs**: `.env` com variáveis de configuração

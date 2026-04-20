# Agentes Especialistas - ProvaSystem

Este documento define os agentes especialistas que compõem o sistema de desenvolvimento autônomo do ProvaSystem. Cada agente possui responsabilidades específicas, skills exclusivas e contexto particular.

---

## Visão Geral dos Agentes

O sistema é composto por **5 agentes especializados** + **1 orquestrador**:

| Agente | Responsabilidade Primária | Skills Principais |
|--------|---------------------------|-------------------|
| **Architect** | Estrutura, padrões, decisões arquiteturais | search_code, search_web, apply_change, run_lint |
| **Backend** | APIs, lógica de negócio, integrações | read_file, apply_change, run_tests, run_lint |
| **Frontend** | Interfaces admin e aluno | read_file, apply_change, search_code |
| **Database** | Schema, migrations, performance | apply_change, run_tests (future), search_web |
| **Test** | Testes E2E, unitários, cobertura | run_tests, apply_change, search_code |
| **Orchestrator** | Coordenação, tracking, meta-decisões | Todas as skills + memory access |

---

## 1. ARCHITECT (Arquiteto)

### Descrição
Agente de mais alto nível. Responsável pela integridade arquitetural do sistema, decisões técnicas de longo prazo, e establecimento/manutenção de padrões.

### Responsabilidades
- Definir/modificar estrutura de pastas
- Estabelecer padrões de código (conventions)
- Aprovar mudanças arquiteturais significativas
- Garantir consistência técnica entre módulos
- Planejar migrações e evolução da stack

### Delimitações (não faz)
- Não implementa features completas
- Não escreve código de business logic extenso
- Não ger commits sem aprovação do orquestrador

### Primary Skills
`search_code`, `search_web`, `apply_change`, `run_lint`, `commit_changes` (com aval)

### Arquivos de Referência
- `.agents/ARCHITECTURE.md` - Decisões arquiteturais (ADRs)
- `.agents/CONVENTIONS.md` - Padrões oficiais
- `tsconfig.json` - Config TypeScript
- `package.json` - Dependências

### Output Signature
- ADRs em `ARCHITECTURE.md`
- Atualizações em `CONVENTIONS.md`
- Diagramas ASCII/textuais
- Recomendações para outros agentes

### Example Task
"Analyze current folder structure and recommend migration to microservices"

---

## 2. BACKEND (Desenvolvedor Backend)

### Descrição
Agente responsável por toda a lógica de servidor: APIs REST, regras de negócio, integrações, e persistência de dados.

### Responsabilidades
- Implementar rotas (admin e student)
- Criar/atualizar repositories
- Escrever lógica de validação e negócio
- Integrar com Supabase, Sheets, etc.
- Error handling e logging
- Documentar APIs (endpoints, schemas)

### Delimitações
- Não modifica arquitetura sem consultar Architect
- Não mexe no frontend (exceto se issue for full-stack)
- Não escreve testes unitários (isso é do Test)

### Primary Skills
`read_file`, `apply_change`, `run_tests`, `run_lint`, `commit_changes`

### Arquivos de Referência
- `src/admin/adminRoutes.ts`
- `src/student/studentRoutes.ts`
- `src/db/*.ts`
- `src/models/*.ts`
- `src/utils/*.ts`

### Output Signature
- Novas rotas implementadas
- Repositórios atualizados
- Schemas de validação
- Erros corrigidos
- Logs estruturados

### Example Task
"Implement endpoint POST /api/student/provas/:id/submeter com validação de período e correção automática"

---

## 3. FRONTEND (Desenvolvedor Frontend)

### Descrição
Agente especializado em interfaces web. Constrói as telas administrativas e do aluno usando Vanilla JS e Bootstrap.

### Responsabilidades
- Implementar páginas HTML + CSS + JS
- Integrar com API backend (fetch wrapper)
- Validações client-side
- Feedback visual (toasts, modals)
- Responsividade (mobile-first)
- Componentes reutilizáveis

### Delimitações
- Não altera backend (exceto se issue for full-stack)
- Não define arquitetura
- Não faz migrations

### Primary Skills
`read_file`, `apply_change`, `search_code`

### Arquivos de Referência
- `public/admin/index.html`, `public/admin/js/`, `public/admin/css/`
- `public/student/index.html`, `public/student/js/`, `public/student/css/`
- `src/admin/adminRoutes.ts` (para referência de endpoints)

### Output Signature
- Páginas HTML atualizadas
- JavaScript de interação
- Estilos CSS custom
- Bug fixes visuais

### Example Task
"Create interactive provas page with filtering and sorting for admin panel"

---

## 4. DATABASE (Especialista em Banco)

### Descrição
Agente focado em tudo relacionado a banco de dados: schema, migrations, performance, queries.

### Responsabilidades
- Criar/alterar migrations Supabase
- Otimizar queries existentes
- Adicionar índices
- Seeds e dados de teste
- Análise de performance (EXPLAIN)
- Garantir integridade referencial

### Delimitações
- Não implementa lógica de aplicação
- Não altera frontend
- Apenas dados + schema

### Primary Skills
`apply_change`, `search_web` (PostgreSQL docs), `run_tests` (futuro)

### Arquivos de Referência
- `supabase/migrations/` - migrations versionadas
- `src/models/*.ts` - tipos refletem schema
- `src/db/*.ts` - queries atuais

### Output Signature
- Novas migrations
- Schema atualizado
- Índices criados
- Queries otimizadas

### Example Task
"Add foreign key constraint on respostas.questao_id and create index"

---

## 5. TEST (Engenheiro de Testes)

### Descrição
Agente responsável por garantir qualidade: testes unitários, integração, E2E, e cobertura.

### Responsabilidades
- Escrever testes unitários (Jest/Vitest)
- Testes de integração (API)
- Testes E2E (Puppeteer/Playwright)
- Configurar CI/CD pipeline
- reports de cobertura
- Automatizar smoke tests

### Delimitações
- Não escreve código de produção
- Não aprova mudanças arquiteturais

### Primary Skills
`run_tests`, `apply_change`, `search_code`, `commit_changes`

### Arquivos de Referência
- `tests/` (a ser criado)
- `jest.config.js` / `vitest.config.ts`
- `.github/workflows/` (CI)

### Output Signature
- Arquivos `*.test.ts` / `*.spec.ts`
- Configuração de test runner
- CI workflow
- Coverage reports

### Example Task
"Write unit tests for ProvaRepository.create() method"

---

## 6. ORCHESTRATOR (Orquestrador)

### Descrição
Meta-agente que coordena os outros. Controla o fluxo de trabalho, gerencia prioridades, e mantém memória persistente.

### Responsabilidades
- Decompor tarefas complexas em subtasks
- Atribuir agentes apropriados
- Verificar conclusão de steps
- Manter `decisions_log.md`, `change_history.md`, `known_issues.md`
- Integrar outputs de múltiplos agentes

### Delimitações
- Não implementa diretamente (exceto tarefas simples)
- Não tem skills exclusivas de código
- Age como manager/coordinator

### Primary Skills
Todas as skills (para delegar e verificar)

### Arquivos de Referência
- `.agents/memory/*.md`
- `.agents/ORCHESTRATOR.md` (este guia)
- `.agents/AGENTS.md` (definições)
- `index.json` (mapa do sistema)

### Output Signature
- Plano de execução
- Logs de decisão
- Integração de outputs
- Status report

### Example Task
"Add Google Sheets export feature" → decompor em:
1. Backend: adicionar sheetService
2. Database: adicionar preference no aluno?
3. Frontend: botão exportar
4. Test: validar geração

---

## Agentes em Ação: Workflow Example

**Tarefa**: "Adicionar suporte a questões dissertativas"

1. **Orchestrator** lê tarefa → consulta `index.json` e `file_map.md`
2. **Orchestrator** decompoõe:
   - Database: adicionar campo `resposta_correta_textual` opcional
   - Backend: ajustar validação e correção (skip automática para dissertativas)
   - Frontend: renderizar textarea em vez de radio buttons
3. **Orchestrator** atribui agentes na ordem: Database → Backend → Frontend
4. Cada agente executa sua parte, consultando `CONVENTIONS.md`
5. **Orchestrator** valida outputs e atualiza `memory/change_history.md`

---

## Skills Disponíveis (para todos os agentes)

| Skill | Descrição | Usado por |
|-------|-----------|-----------|
| `read_file` | Ler conteúdo completo de arquivo | Todos |
| `search_code` | Buscar padrão regex no código | Todos |
| `apply_change` | Aplicar string replacement em arquivo | Todos |
| `run_tests` | Executar suite de testes | Backend, Test |
| `run_lint` | Executar linter/formatter | Backend, Architect |
| `commit_changes` | Criar git commit | Backend, Frontend, Test |
| `create_pr` | Abrir Pull Request | Orchestrator |
| `search_web` | Buscar docs/exemplos via web | Architect, Database |

---

## Prioridades de Agentes (para múltiplas tasks)

1. **Architect** - decisões estratégicas (bloqueia outras se consulta necessária)
2. **Database** - migrações bloqueantes (devem vir antes do código que as usa)
3. **Backend** - implementa core logic
4. **Frontend** - depende do backend estar funcional
5. **Test** - valida após features prontas
6. **Orchestrator** - coordena todos simultaneamente

---

## Como os Agentes se Comunicam

- **Contexto compartilhado**: `.agents/` folder
- **Arquivos de estado**: `memory/*.md`
- **Índice central**: `index.json` (fonte da verdade)
- **Comunicação indireta**: agents escrevem outputs, outros leem

**Exemplo**: Backend atualiza `src/db/provaRepository.ts` → Frontend lê mudanças → ajusta `public/admin/js/pages/provas.js`

---

## Fallbacks e Contingências

Se agente falhar:
1. Orchestrator tenta novamente com instructions mais explícitas
2. Orchestrator roteia para outro agente (ex: Database revisa query do Backend)
3. Se persistir: escalar para Architect
4. Registrar em `known_issues.md` o que falhou

---

## Convenções de Commit (por agente)

### Commit Message Format
```
<agent>(<scope>): <subject>

<body explaining what and why>

Closes #<issue_number>
```

**Examples**:
```
backend(provas): add validation for date_inicio > date_fim
frontend(styles): fix modal overflow on mobile
database(migration): add index on submissoes.aluno_id
test(submissao): add unit test for correction logic
```

---

## Permissions & Safety

### Edit Permissions
- **Architect**: pode editar todos arquivos de config
- **Backend**: pode editar `src/` exceto `config/` e arquivos de架构
- **Frontend**: apenas `public/` + `.agents/prompts/frontend.txt`
- **Database**: apenas `supabase/` + `src/models/` + `src/db/`
- **Test**: apenas `tests/` + config de teste

### Dangerous Operations (require Architect approval)
- Refatoração massiva (>10 arquivos)
- Mudança de stack (ex: trocar Supabase)
- Alteração em tsconfig.json significativa
- Mudança em package.json (dependencies)
- Modificações em `src/server.ts` setup

---

## Evolution & Adding New Agents

Para adicionar novo agente especializado:

1. Definir em `AGENTS.md` (este arquivo)
2. Criar `.agents/agents/<nome>.md` com definição detalhada
3. Adicionar entrada em `index.json` → `agents`
4. Atualizar `ORCHESTRATOR.md` com nova priority
5. Criar prompt em `prompts/` se necessário
6. Registrar em `memory/decisions_log.md` motivo da criação

---

**Document Status**: V1.0 - Pós-migração Supabase
**Next Review**: Após implementação de testes automatizados

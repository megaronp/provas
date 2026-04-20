# File Map - ProvaSystem

Este arquivo mapeia os principais arquivos do projeto ProvaSystem para referência dos agentes. Útil para entender onde cada responsabilidade reside.

---

## Core Backend Files

### Entry Points
- `src/server.ts` - Ponto de entrada do Express, configura middleware, rotas, error handling
- `package.json` - Dependências, scripts, entry points

### Configuration
- `src/config/database.ts` - Configuração Supabase client
- `src/config/cors.ts` - Configuração CORS
- `src/config/env.ts` - Validação de variáveis de ambiente
- `tsconfig.json` - Configuração TypeScript

### Database Layer
- `src/db/supabaseClient.ts` - Singleton cliente Supabase
- `src/db/provaRepository.ts` - CRUD de provas e questões
- `src/db/respostaRepository.ts` - CRUD de submissions e respostas

### Models / Types
- `src/models/Prova.ts` - Interface Prova + ProvaCreate DTO
- `src/models/Questao.ts` - Interface Questão + QuestaoCreate DTO
- `src/models/Aluno.ts` - Interface Aluno
- `src/models/Submissao.ts` - Interface Submissão
- `src/models/Resposta.ts` - Interface Resposta

### Routes
- `src/admin/adminRoutes.ts` - Todas rotas /api/admin/*
- `src/student/studentRoutes.ts` - Todas rotas /api/student/*

### Utils
- `src/utils/validators.ts` - Validadores custom (CPF, datas, etc.)
- `src/utils/formatters.ts` - Formatadores (data brasileira, notas)
- `src/utils/errors.ts` - Error classes custom

### Optional / Legacy
- `src/sheets/` - Integração Google Sheets (opcional)
- `src/db/jsonRepository.ts` - ??? (se ainda existir legado)

---

## Frontend Files

### Admin Panel
- `public/admin/index.html` - Layout principal (Bootstrap)
- `public/admin/css/main.css` - Estilos custom admin
- `public/admin/js/app.js` - Bootstrap do painel admin
- `public/admin/js/api.js` - Wrapper fetch() para chamadas API
- `public/admin/js/pages/provas.js` - Lógica da página de provas
- `public/admin/js/pages/questoes.js` - Lógica da página de questões
- `public/admin/js/pages/relatorios.js` - Lógica da página de relatórios

### Student Portal
- `public/student/index.html` - Layout aluno
- `public/student/css/main.css` - Estilos custom aluno
- `public/student/js/app.js` - Bootstrap portal aluno
- `public/student/js/api.js` - Wrapper fetch() estudante
- `public/student/js/prova-interactive.js` - Lógica de responder prova

---

## Web Assets
- `public/admin/css/` - Estilos admin
- `public/admin/js/` - Scripts admin
- `public/student/css/` - Estilos aluno
- `public/student/js/` - Scripts aluno
- `public/images/` - Imagens gerais (logo, icons)

---

## Agent System Files (`.agents/`)

### Root Level
- `.agents/PROJECT_CONTEXT.md` - Este documento
- `.agents/ARCHITECTURE.md` - Decisões arquiteturais
- `.agents/CONVENTIONS.md` - Padrões de código
- `.agents/AGENTS.md` - Definição dos agentes especialistas
- `.agents/SKILLS.md` - Catálogo de skills
- `.agents/ORCHESTRATOR.md` - Regras do orquestrador
- `.agents/index.json` - Índice JSON do sistema
- `.agents/file_map.md` - Este arquivo (mapeamento)

### Agents Subfolder
- `.agents/agents/architect.md` - Agente arquiteto
- `.agents/agents/backend.md` - Agente backend
- `.agents/agents/frontend.md` - Agente frontend
- `.agents/agents/test.md` - Agente de testes
- `.agents/agents/database.md` - Agente de banco

### Skills Subfolder
- `.agents/skills/read_file.md` - Skill: ler arquivo
- `.agents/skills/search_code.md` - Skill: buscar código
- `.agents/skills/apply_change.md` - Skill: aplicar mudança
- `.agents/skills/run_tests.md` - Skill: executar testes
- `.agents/skills/run_lint.md` - Skill: executar lint
- `.agents/skills/commit_changes.md` - Skill: commitar
- `.agents/skills/create_pr.md` - Skill: criar PR
- `.agents/skills/search_web.md` - Skill: buscar web

### Memory Subfolder
- `.agents/memory/decisions_log.md` - Log de decisões tomadas
- `.agents/memory/known_issues.md` - Problemas conhecidos
- `.agents/memory/change_history.md` - Histórico de mudanças

### Prompts Subfolder
- `.agents/prompts/architect.txt` - Prompt do arquiteto
- `.agents/prompts/backend.txt` - Prompt backend
- `.agents/prompts/frontend.txt` - Prompt frontend
- `.agents/prompts/test.txt` - Prompt test
- `.agents/prompts/database.txt` - Prompt database

---

## Documentation Files

### Markdown
- `README.md` - Instruções gerais do projeto
- `docs/` - (futuro) documentação detalhada
- `API.md` - (futuro) especificação REST completa

### Database
- `supabase/migrations/` - Migrations versionados
- `supabase/seed.sql` - Dados iniciais (dev)

### Dev & Operations
- `package.json` scripts:
  - `npm run dev` - Servidor dev (ts-node-dev)
  - `npm run build` - Build TypeScript
  - `npm start` - Produção
  - `npm run lint` - ESLint
  - `npm run test` - Testes (futuro)
- `.env.example` - Template de variáveis de ambiente
- `.gitignore` - Arquivos ignorados pelo git

---

## File Responsibility Matrix

| File/Directory | Primary Owner Agent | Purpose |
|---------------|--------------------|---------|
| `src/server.ts` | architect | Express app bootstrap |
| `src/config/` | architect | Configurações da aplicação |
| `src/db/*` | database | Acesso ao Supabase |
| `src/models/*` | database | Tipos TypeScript |
| `src/admin/*` | backend | Rotas e lógica admin |
| `src/student/*` | backend | Rotas e lógica aluno |
| `src/sheets/*` | backend | Integração Sheets |
| `public/admin/*` | frontend | Painel administrativo |
| `public/student/*` | frontend | Portal do aluno |
| `.agents/agents/*` | todos | Definições de agentes |
| `.agents/skills/*` | todos | Habilidades dos agentes |
| `.agents/memory/*` | orchestrator | Memória persistente |
| `.agents/prompts/*` | orchestrator | Prompts de sistema |

---

## File Change Patterns

### Criar Nova Feature
1. **Database**: Adicionar colunas/tabelas (migration)
2. **Backend**: Criar/modificar repository + routes
3. **Frontend**: Criar/modificar página + API calls
4. **Tests**: Escrever testes (futuro)

### Modificar Existing Feature
1. Localizar arquivos usando `file_map.md`
2. Check `src/models/` para tipos
3. Verificar `src/db/` para queries
4. Atualizar rotas em `src/*/routes.ts`
5. Atualizar frontend correspondente

### Debugging Flow
1. Verificar logs no servidor (`pm2 logs` ou `console`)
2. Frontend: DevTools Network tab ver requests
3. Backend: Validar schemas e queries Supabase
4. Database: Supabase dashboard ou SQL direto

---

## Dependencies Graph (Simplified)

```
package.json
├── express
├── typescript
├── ts-node-dev
├── @supabase/supabase-js
├── zod (validação) ← recommended
├── dotenv
├── cors
└── helmet (security)

Frontend (CDN)
├── Bootstrap 5 CSS
├── Bootstrap 5 JS
└── Google Fonts (Inter, Roboto)
```

---

**Nota**: Este arquivo é referência para agentes autônomos. Sempre que estrutura mudar, atualize `file_map.md` e `index.json`.

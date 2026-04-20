# Project Context - ProvaSystem

## Visão Geral
ProvaSystem é um sistema online de provas e avaliações desenvolvido para instituições educacionais. Permite a criação, gestão e aplicação de provas digitais com correção automática, relatórios detalhados e integração opcional com Google Sheets.

## Stack Tecnológica
- **Backend**: Node.js 18, Express, TypeScript
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Banco de Dados**: Supabase (PostgreSQL)
- **Desenvolvimento**: ts-node-dev para hot-reload

## Estrutura do Projeto
```
prova-system/
├── src/
│   ├── server.ts              # Ponto de entrada do servidor
│   ├── config/                # Configurações (Supabase, CORS, etc.)
│   ├── db/                    # Camada de banco de dados
│   │   ├── provaRepository.ts
│   │   ├── respostaRepository.ts
│   │   └── supabaseClient.ts
│   ├── admin/                 # Rotas e lógica administrativa
│   │   └── adminRoutes.ts
│   ├── student/               # Rotas e lógica do aluno
│   │   └── studentRoutes.ts
│   ├── models/                # Tipos TypeScript e interfaces
│   │   ├── Prova.ts
│   │   ├── Questao.ts
│   │   └── Aluno.ts
│   ├── sheets/                # Integração opcional Google Sheets
│   └── utils/                 # Utilitários (validadores, formatters)
├── public/
│   ├── admin/
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   └── student/
│       ├── index.html
│       ├── css/
│       └── js/
├── package.json
├── tsconfig.json
└── README.md
```

## Entidades Principais

### Prova
- Título, descrição, data início/fim, status (draft/active/closed)
- Relacionamento: uma prova tem N questões
- Campos: `id`, `titulo`, `descricao`, `data_inicio`, `data_fim`, `status`

### Questão
- Texto, tipo (multipla_escolha/verdadeiro_falso/dissertativa), enunciado
- Alternativas (para múltipla escolha/VF), resposta correta
- Campos: `id`, `prova_id`, `tipo`, `enunciado`, `alternativas`, `resposta_correta`

### Aluno
- Nome, email, identificação única
- Campos: `id`, `nome`, `email`, `identificacao`

### Submissão
- Registro de aluno respondendo uma prova
- Campos: `id`, `prova_id`, `aluno_id`, `data_submissao`, `status`

### Resposta
- Resposta individual de um aluno a uma questão
- Campos: `id`, `submissao_id`, `questao_id`, `resposta_aluno`, `correcao_automatica`, `nota`, `feedback`

## Funcionalidades

### Painel Administrativo
- CRUD completo de provas e questões
- Visualização de relatórios e estatísticas
- Exportação de dados (CSV/Sheets opcional)
- Gestão de alunos
- Monitoramento de submissions em tempo real

### Portal do Aluno
- Lista de provas disponíveis
- Interface de resposta (apenas uma vez por prova)
- Visualização de resultado e feedback após fechamento
- Histórico de provas realizadas

### Correção Automática
- Questões múltipla escolha e VF: correção automática instantânea
- Dissertativas: requerem correção manual posterior
- Cálculo de nota baseado em peso das questões

## APIs REST (atual)

### Admin Routes
```
POST   /api/admin/provas              Criar prova
GET    /api/admin/provas              Listar provas
PUT    /api/admin/provas/:id          Atualizar prova
DELETE /api/admin/provas/:id          Excluir prova

POST   /api/admin/questoes            Criar questão
GET    /api/admin/questoes            Listar questões
PUT    /api/admin/questoes/:id        Atualizar questão
DELETE /api/admin/questoes/:id        Excluir questão

GET    /api/admin/relatorios          Relatórios e estatísticas
GET    /api/admin/alunos              Gestão de alunos
```

### Student Routes
```
GET    /api/student/provas/disponiveis Provas ativas
POST   /api/student/provas/:id/submeter Submeter prova
GET    /api/student/resultados/:id    Resultado da prova
GET    /api/student/historico         Histórico de provas
```

## Migração Realizada
- **Antes**: Sistema baseado em JSON files + Google Sheets
- **Atual**: Migrado completamente para Supabase
- Google Sheets mantido como funcionalidade opcional (exportação)
- Schema SQL versionado em `supabase/migrations/`

## Decisões Arquiteturais Relevantes
1. TypeScript em todo o backend para type safety
2. Repository pattern para abstrair acesso ao Supabase
3. Validação de dados no backend e frontend
4. CORS configurado para domínios específicos
5. Sessões stateless (possível JWT futuro)
6. Frontend desacoplado do backend via API REST

## Contexto para Agentes
- Projeto em produção com usuários reais
- Bancos de dados contêm dados sensíveis de alunos
- Necessidade de backward compatibility ao modificar APIs
- Testes manuais atuais (sem cobertura automatizada)
- Deploy em servidor Linux (Ubuntu)

# GUIA: Estrutura de Agentes, Skills e Orquestrador para Projetos de Software

---

## VISÃO GERAL

Este guia descreve todos os arquivos, documentos e estruturas que devem ser criados para montar um sistema de agentes especialistas capaz de entender seu projeto e aplicar melhorias de forma autônoma e precisa.

---

## PARTE 1 — ESTRUTURA DE PASTAS A CRIAR

```
raiz-do-projeto/
│
├── .agents/                          ← Pasta principal do sistema de agentes
│   ├── PROJECT_CONTEXT.md            ← Mapa geral do projeto
│   ├── AGENTS.md                     ← Definição de cada agente
│   ├── SKILLS.md                     ← Catálogo de skills disponíveis
│   ├── ORCHESTRATOR.md               ← Regras do orquestrador
│   ├── CONVENTIONS.md                ← Convenções de código do projeto
│   ├── ARCHITECTURE.md               ← Arquitetura e decisões técnicas
│   │
│   ├── agents/                       ← Um arquivo por agente especialista
│   │   ├── architect_agent.md
│   │   ├── backend_agent.md
│   │   ├── frontend_agent.md
│   │   ├── test_agent.md
│   │   └── database_agent.md
│   │
│   ├── skills/                       ← Um arquivo por skill
│   │   ├── read_file.md
│   │   ├── search_code.md
│   │   ├── apply_change.md
│   │   ├── run_tests.md
│   │   ├── create_component.md
│   │   └── validate_schema.md
│   │
│   └── memory/                       ← Memória persistente entre sessões
│       ├── decisions_log.md          ← Log de decisões tomadas
│       ├── known_issues.md           ← Problemas conhecidos
│       └── change_history.md        ← Histórico de mudanças feitas pelos agentes
│
└── [resto do projeto]
```

---

## PARTE 2 — DOCUMENTOS A CRIAR (com instruções de conteúdo)

---

### 📄 1. PROJECT_CONTEXT.md
**Propósito:** É o primeiro arquivo que qualquer agente deve ler. Dá uma visão completa do projeto.

**O que deve conter:**
- Nome e descrição do projeto
- Stack tecnológica completa (linguagem, framework, banco de dados, libs principais)
- Estrutura de pastas comentada (cada pasta com sua responsabilidade)
- Como rodar o projeto localmente
- Principais fluxos de negócio (ex: "Cadastro → Login → Dashboard")
- Integrações externas (APIs de terceiros, serviços externos)
- Variáveis de ambiente necessárias e onde ficam
- Referências para os outros documentos do sistema de agentes

**Exemplo de estrutura:**
```
# Projeto: [Nome]
## Stack
## Estrutura de Pastas
## Como Rodar
## Fluxos Principais
## Integrações
## Variáveis de Ambiente
## Documentos Relacionados
```

---

### 📄 2. AGENTS.md
**Propósito:** Define quais agentes existem, suas responsabilidades e quando cada um deve ser acionado.

**O que deve conter para cada agente:**
- Nome do agente
- Domínio de atuação (quais partes do projeto ele gerencia)
- Pastas e arquivos sob sua responsabilidade
- Quando ele deve ser acionado (gatilhos)
- Skills que ele pode usar
- O que ele NÃO deve fazer (limites)
- Com quais outros agentes ele se comunica

**Agentes mínimos a definir:**
- OrchestratorAgent — recebe pedidos, analisa e delega
- ArchitectAgent — estrutura, padrões, design
- BackendAgent — lógica de negócio, APIs, serviços
- FrontendAgent — componentes, páginas, estado
- DatabaseAgent — models, migrations, queries
- TestAgent — testes unitários, integração, e2e

---

### 📄 3. SKILLS.md
**Propósito:** Catálogo de todas as ações que os agentes podem executar.

**O que deve conter para cada skill:**
- Nome da skill
- Descrição do que ela faz
- Parâmetros de entrada
- O que ela retorna
- Exemplos de uso
- Quais agentes podem usá-la

**Skills mínimas a definir:**

| Skill | O que faz |
|-------|-----------|
| `read_file` | Lê o conteúdo de um arquivo específico |
| `search_code` | Busca por padrão, função ou termo no código |
| `find_component` | Localiza onde um componente/módulo está definido |
| `apply_change` | Aplica uma modificação em um arquivo |
| `create_file` | Cria um novo arquivo no local correto |
| `run_tests` | Executa a suíte de testes e retorna resultado |
| `validate_types` | Verifica erros de tipagem |
| `check_conventions` | Valida se o código segue as convenções do projeto |
| `get_dependencies` | Lista dependências de um módulo ou função |
| `trace_flow` | Mapeia o caminho de um fluxo de negócio no código |

---

### 📄 4. ORCHESTRATOR.md
**Propósito:** Define as regras de decisão do agente orquestrador — como ele interpreta pedidos e decide quem acionar.

**O que deve conter:**
- Algoritmo de decisão (fluxo de como o pedido é analisado)
- Tabela de palavras-chave → agente responsável
- Regras de prioridade quando múltiplos agentes são necessários
- Como lidar com pedidos ambíguos (perguntas de clarificação)
- Protocolo de comunicação entre agentes (como um agente chama o outro)
- O que fazer quando nenhum agente cobre o pedido

**Exemplo de regras:**
```
SE o pedido contém "tela", "página", "componente", "botão" → FrontendAgent
SE o pedido contém "API", "endpoint", "rota", "serviço" → BackendAgent
SE o pedido contém "banco", "tabela", "query", "migration" → DatabaseAgent
SE o pedido contém "teste", "spec", "coverage" → TestAgent
SE o pedido é estrutural ou de padrão → ArchitectAgent
SE múltiplos domínios → Orquestrador cria plano e aciona em sequência
```

---

### 📄 5. CONVENTIONS.md
**Propósito:** Documento de convenções que todo agente deve respeitar ao gerar ou modificar código.

**O que deve conter:**
- Padrão de nomenclatura (arquivos, variáveis, funções, classes)
- Estrutura obrigatória de componentes/módulos
- Padrões de import/export
- Como tratar erros no projeto
- Padrão de comentários e documentação inline
- Regras de formatação (tabs vs spaces, aspas simples vs duplas, etc.)
- Libs que devem ser usadas para tarefas específicas (ex: "use axios para HTTP, não fetch")
- Libs que são proibidas ou deprecadas no projeto

---

### 📄 6. ARCHITECTURE.md
**Propósito:** Documenta as decisões arquiteturais para que os agentes entendam o "porquê" das estruturas.

**O que deve conter:**
- Diagrama ou descrição da arquitetura geral
- Padrões adotados (MVC, Clean Architecture, Feature-based, etc.)
- Onde fica cada camada do sistema e sua responsabilidade
- Como é feita a comunicação entre camadas
- Decisões técnicas importantes já tomadas e o motivo
- O que NÃO deve ser feito e por quê (anti-patterns do projeto)
- Fluxo de dados principal

---

### 📄 7. agents/[nome_agente].md (um por agente)
**Propósito:** Instrução detalhada de cada agente especialista.

**O que deve conter:**
- Identidade e papel do agente
- Lista exata de arquivos e pastas que ele gerencia
- Passo a passo de como ele deve agir ao receber uma tarefa
- Exemplos de tarefas que ele resolve
- Perguntas que ele deve fazer antes de agir (se necessário)
- Output esperado (o que ele entrega ao final)
- Erros comuns que ele deve evitar

---

### 📄 8. skills/[nome_skill].md (um por skill)
**Propósito:** Documentação técnica de cada skill individual.

**O que deve conter:**
- Nome e descrição
- Assinatura da função (se implementada em código)
- Pré-condições (o que precisa ser verdade para a skill funcionar)
- Pós-condições (o que muda após a execução)
- Exemplos de uso com input e output esperado
- Possíveis erros e como tratá-los

---

### 📄 9. memory/decisions_log.md
**Propósito:** Log das decisões tomadas pelos agentes para evitar contradições futuras.

**Formato de cada entrada:**
```
## [DATA] — [Descrição curta da decisão]
- **Agente:** [Quem tomou a decisão]
- **Contexto:** [Por que foi necessário]
- **Decisão:** [O que foi decidido]
- **Arquivos afetados:** [Lista de arquivos]
- **Impacto:** [O que isso afeta no projeto]
```

---

### 📄 10. memory/change_history.md
**Propósito:** Histórico de todas as mudanças aplicadas pelos agentes.

**Formato de cada entrada:**
```
## [DATA] — [Descrição da mudança]
- **Solicitação original:** [O que o usuário pediu]
- **Agente responsável:** [Quem executou]
- **Arquivos modificados:** [Lista]
- **Resumo da mudança:** [O que foi feito]
- **Testes executados:** [Passou/Falhou]
```

---

## PARTE 3 — ARQUIVOS DE SUPORTE TÉCNICO

Além dos documentos acima, crie os seguintes arquivos de suporte:

### 🗂️ .agents/index.json
Arquivo de índice que mapeia cada funcionalidade do projeto para os arquivos correspondentes. Permite que agentes encontrem código rapidamente.

```json
{
  "features": {
    "autenticacao": {
      "agente": "BackendAgent",
      "arquivos": ["src/auth/login.ts", "src/auth/register.ts"],
      "rotas": ["/login", "/register", "/logout"]
    },
    "dashboard": {
      "agente": "FrontendAgent",
      "arquivos": ["src/pages/Dashboard.tsx", "src/components/DashboardCard.tsx"],
      "rotas": ["/dashboard"]
    }
  }
}
```

### 🗂️ .agents/file_map.md
Mapa comentado de todos os arquivos importantes do projeto, descrevendo o que cada um faz em uma linha.

```
src/
  auth/
    login.ts          → Lógica de autenticação JWT
    register.ts       → Validação e criação de usuário
  services/
    api.ts            → Cliente HTTP base com interceptors
    userService.ts    → CRUD de usuários
  components/
    Button.tsx        → Botão reutilizável com variantes
    Modal.tsx         → Modal genérico com Portal
```

### 🗂️ .agents/prompts/
Pasta com prompts pré-definidos para os agentes — reutilizados em cada sessão.

- `system_orchestrator.txt` — Prompt de sistema do orquestrador
- `system_backend.txt` — Prompt de sistema do agente backend
- `system_frontend.txt` — Prompt de sistema do agente frontend
- `task_template.txt` — Template de como formatar uma tarefa antes de enviar a um agente

---

## PARTE 4 — ORDEM DE CRIAÇÃO RECOMENDADA

Execute na seguinte ordem para montar a estrutura corretamente:

```
1. Crie PROJECT_CONTEXT.md  ← Base de tudo
2. Crie ARCHITECTURE.md     ← Antes de definir agentes
3. Crie CONVENTIONS.md      ← Antes de definir skills
4. Crie file_map.md         ← Mapeie o código existente
5. Crie index.json          ← Indexe as funcionalidades
6. Crie AGENTS.md           ← Defina os agentes
7. Crie agents/*.md         ← Detalhe cada agente
8. Crie SKILLS.md           ← Defina as skills
9. Crie skills/*.md         ← Detalhe cada skill
10. Crie ORCHESTRATOR.md    ← Regras de decisão
11. Crie memory/*.md        ← Comece os logs vazios
12. Crie prompts/*.txt      ← Monte os prompts de sistema
```

---

## PARTE 5 — COMO USAR O SISTEMA

Ao iniciar uma sessão com a IA, siga este protocolo:

**1. Sempre comece enviando:**
```
Leia os arquivos:
- .agents/PROJECT_CONTEXT.md
- .agents/AGENTS.md
- .agents/file_map.md
- .agents/memory/change_history.md
```

**2. Ao fazer um pedido de melhoria, use este formato:**
```
[MELHORIA]
Contexto: [Descreva brevemente o que quer]
Área: [Frontend / Backend / Database / Teste / Arquitetura]
Comportamento atual: [Como está hoje]
Comportamento esperado: [Como deve ficar]
Restrições: [O que não pode mudar]
```

**3. O orquestrador irá:**
- Ler o contexto do projeto
- Identificar os arquivos relevantes via file_map.md e index.json
- Acionar o agente correto
- Aplicar a mudança respeitando CONVENTIONS.md
- Registrar em change_history.md

---

## PARTE 6 — MANUTENÇÃO DO SISTEMA

Para manter o sistema funcionando bem ao longo do tempo:

- **Após cada mudança significativa:** Atualize file_map.md e index.json
- **Ao criar nova funcionalidade:** Adicione entrada no index.json
- **Ao tomar decisão arquitetural:** Registre em decisions_log.md
- **Mensalmente:** Revise CONVENTIONS.md e adicione novos padrões identificados
- **Ao onboarding de nova tech:** Crie skill correspondente em skills/

---

*Este guia deve ser revisado e atualizado conforme o projeto evolui.*

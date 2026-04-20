# Coding Conventions - ProvaSystem

Este documento define padrões de código, nomenclatura e práticas recomendadas para o projeto ProvaSystem. Estes padrões devem ser seguidos por todos os agentes e desenvolvedores.

---

## 1. Linguagem e Formatação

### TypeScript
- **Strict mode**: `tsconfig.json` com `strict: true`
- Tipos explícitos em todas as funções e variáveis públicas
- Inferência permitida apenas em escopos locais óbvios
- Sem `any` (usar `unknown` se necessário e type guard depois)

### JavaScript (Frontend)
- ES6+ features permitted (const/let, arrow functions, destructuring)
- Não usar `var`
- Sem `==` (sempre `===`)
- Semicolons opcionais mas consistentes (sem misturar)

### Indentação
- 2 espaços (não tabs)
- Chaves em same line para funções/classes
- Max line length: 100 caracteres

---

## 2. Nomenclatura

### Arquivos
```
types.ts              # tipos compartilhados
provaRepository.ts    # Pessoa singular, camelCase com sufixo
adminRoutes.ts        # plural no final (routes, controllers)
studentService.ts     # camada de serviço
createProva.html      # verb-first para actions
```

### Pastas
```
src/
  ├── admin/           # domain-based (não por tipo)
  ├── student/
  ├── db/
  ├── models/
  └── utils/
```

### Variáveis e Funções (camelCase)
```typescript
const provaId = 1;
const nomeAluno = "João";

function getProvaById(id: number): Promise<Prova | null>
function criarQuestao(dados: QuestaoCreate): Promise<Questao>
```

### Classes e Interfaces (PascalCase)
```typescript
interface Prova {
  id: number;
  titulo: string;
}

class ProvaRepository {
  private supabase: SupabaseClient;
}
```

### Constantes (UPPER_SNAKE_CASE)
```typescript
const MAX_QUESTOES_POR_PROVA = 50;
const STATUS_ATIVO = "ativo";
```

---

## 3. Padrões de Código

### Padrão Repository
```typescript
// src/db/provaRepository.ts
export class ProvaRepository {
  async create(dados: ProvaCreate): Promise<Prova> { /* ... */ }
  async findById(id: number): Promise<Prova | null> { /* ... */ }
  async update(id: number, dados: Partial<ProvaCreate>): Promise<Prova> { /* ... */ }
  async delete(id: number): Promise<void> { /* ... */ }
  async listAtivas(): Promise<Prova[]> { /* ... */ }
}
```

### Padrão Route Handler
```typescript
// src/admin/adminRoutes.ts
router.post("/provas", validateBody(provaSchema), async (req, res) => {
  try {
    const prova = await provaRepository.create(req.body);
    res.status(201).json(prova);
  } catch (error) {
    next(error);
  }
});
```

### Padrão Service (quando necessário)
```typescript
// src/services/provaService.ts
export class ProvaService {
  constructor(
    private provaRepo: ProvaRepository,
    private questaoRepo: QuestaoRepository
  ) {}

  async criarProvaCompleta(dados: ProvaCompletaDTO): Promise<Prova> {
    // Orquestra criação de prova + questões em transação
  }
}
```

---

## 4. Estrutura de Pastas por Domínio

### Backend (src/)
```
src/
├── server.ts                    # Express app setup
├── config/
│   ├── database.ts
│   ├── cors.ts
│   └── env.ts
├── db/
│   ├── supabaseClient.ts
│   ├── provaRepository.ts
│   └── respostaRepository.ts
├── models/
│   ├── Prova.ts
│   ├── Questao.ts
│   ├── Aluno.ts
│   ├── Submissao.ts
│   └── Resposta.ts
├── admin/
│   ├── adminRoutes.ts           # Todas rotas /api/admin/*
│   ├── adminController.ts       # Lógica dos handlers (opcional)
│   └── middleware/
│       └── auth.ts              # Autenticação admin
├── student/
│   ├── studentRoutes.ts
│   └── studentController.ts
├── sheets/
│   ├── sheetsService.ts
│   └── googleSheets.ts
├── utils/
│   ├── validators.ts            # Validação custom
│   ├── formatters.ts            # Formatadores (datas, notas)
│   └── errors.ts                # Error classes custom
├── types/
│   └── index.ts                 # Tipos globais compartilhados
└── logger/
    └── logger.ts                # Winston/Pino logger
```

### Frontend (public/)
```
public/
├── admin/
│   ├── index.html
│   ├── css/
│   │   ├── main.css
│   │   └── components/
│   │       ├── table.css
│   │       └── modal.css
│   ├── js/
│   │   ├── app.js              # Bootstrap principal
│   │   ├── api.js              # Wrapper fetch()
│   │   ├── pages/
│   │   │   ├── provas.js
│   │   │   └── relatorios.js
│   │   └── components/
│   │       ├── modal.js
│   │       └── table.js
│   └── assets/
│       └── img/
└── student/
    ├── index.html
    ├── css/
    └── js/
        ├── app.js
        ├── api.js
        └── prova-interactive.js
```

---

## 5. HTTP API Conventions

### Request/Response JSON Schema
```json
// Success Response (200/201)
{
  "success": true,
  "data": { /* entity */ },
  "message": "Prova criada com sucesso"
}

// Error Response (400/500)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campo título é obrigatório",
    "details": { "field": "titulo" }
  }
}

// List Response
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### HTTP Status Codes
- `200 OK` - GET bem-sucedido
- `201 Created` - POST bem-sucedido (criação)
- `204 No Content` - DELETE bem-sucedido sem retorno
- `400 Bad Request` - Validação falhou
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não existe
- `409 Conflict` - Conflito (ex: prova já existe com mesmo nome)
- `500 Internal Server Error` - Erro interno

### Paginação
```
GET /api/admin/provas?page=1&limit=20

// Query params
page: number (default 1)
limit: number (default 20, max 100)
sortBy: string (default "created_at")
order: "asc" | "desc"
```

---

## 6. Validação de Dados

### Backend (Zod/Joi recommended)
```typescript
import { z } from "zod";

const provaSchema = z.object({
  titulo: z.string().min(3).max(200),
  descricao: z.string().optional(),
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  questoes: z.array(questaoSchema).min(1).max(50)
});

// Em rota:
const validated = provaSchema.parse(req.body);
```

### Frontend (HTML5 + JS)
```html
<input type="text" required minlength="3" maxlength="200">
```
```javascript
if (!titulo || titulo.length < 3) {
  showError("Título deve ter no mínimo 3 caracteres");
}
```

---

## 7. Error Handling

### Backend
```typescript
// Erros custom
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Middleware error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: err.message }
    });
  }
  // Log e retorno genérico
  console.error(err);
  res.status(500).json({ success: false, error: "INTERNAL_ERROR" });
});
```

### Frontend
```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error.message);
    }
    return json.data;
  } catch (error) {
    console.error("API Error:", error);
    showToast(error.message, "error");
    throw error;
  }
}
```

---

## 8. Logging

### Backend (Estruturado)
```typescript
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [new transports.Console()]
});

// Uso
logger.info("Prova criada", { provaId: 123, userId: 456 });
logger.error("Erro no repositório", { error: err.message, stack: err.stack });
```

### Frontend
```javascript
console.log("[ProvaSystem]", message);
console.error("[ProvaSystem Error]", error);
// Future: integração com Sentry
```

---

## 9. Database Conventions

### Nomenclatura de Tabelas/Colunas
- Tabelas: **plural** snake_case (`provas`, `questoes`, `submissoes`)
- Colunas: **snake_case** (`data_inicio`, `resposta_aluno`)
- Foreign keys: `<table>_id` (`prova_id`, `questao_id`)
- Timestamps: `created_at`, `updated_at` (gerados automaticamente)

### Queries
- Sem `SELECT *` - listar colunas explicitamente
- Usar indexes em foreign keys
- Transações para writes múltiplos
- Prefira operações em batch quando possível

---

## 10. Frontend Conventions

### ES6 Modules (se usarmos bundler no futuro)
```javascript
import { api } from "./api.js";
import { Modal } from "./components/modal.js";
```

### DOM Manipulation
- Vanilla JS, sem jQuery
- `document.querySelector()` e `querySelectorAll()`
- Event delegation para listas dinâmicas
- `addEventListener()` não inline

### CSS
- BEM-ish naming (`.prova__card--active`)
- Variáveis CSS para cores/spacing
- Mobile-first CSS
- Media queries em breakpoints: 576px, 768px, 992px

---

## 11. Testing Conventions (Future)

### Estrutura de Testes
```
src/
├── provaRepository.test.ts
├── adminRoutes.test.ts
└── integration/
    └── criar-prova.e2e.test.ts
```

### Naming
- `*.test.ts` ou `*.spec.ts`
- `describe()` blocos por feature
- `it()` descrições claras ("deve criar prova", "não deve permitir data inválida")

---

## 12. Git Conventions (para Commits)

### Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

**Examples**:
```
feat(admin): adicionar exportação CSV de relatórios
fix(student): corrigir validação de data de submissão
docs(readme): atualizar instruções de deploy
```

### Branches
```
main              # produção
develop           # staging
feature/xyz       # novas features
hotfix/xyz        # bugs críticos
release/v1.2.0    # preparação release
```

---

## 13. Environment Variables

### .env (não commitado)
```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyxxx
CORS_ORIGIN=https://provas.minhaescola.com.br
```

### Acesso via config
```typescript
import { config } from "dotenv";
config();

const supabaseUrl = process.env.SUPABASE_URL!; // non-null se necessário
```

---

## 14. Secrets & Security
**NUNCA** commitar:
- `.env` files
- `supabaseServiceKey` (admin key)
- Chaves de API externas
- Senhas de banco

Usar `process.env` e variáveis de ambiente no servidor.

---

## 15. Documentation Standards

### Docstrings (TypeScript)
```typescript
/**
 * Cria uma nova prova no sistema
 * @param dados - Dados da prova incluindo questões
 * @returns Prova criada com ID gerado
 * @throws ValidationError se dados inválidos
 */
async create(dados: ProvaCreate): Promise<Prova> { ... }
```

### README Updates
Quando adicionar feature significativa, atualizar:
- `README.md` - seção "Funcionalidades"
- `docs/` - se houver pasta docs
- Comentários inline só se lógica não óbvia

---

## 16. Agent-Specific Conventions

Para agentes autônomos (código auto-gerado):
1. Seguir **exatamente** os padrões acima
2. Não reimplementar funcionalidades existentes (checar `file_map.md`)
3. Incluir tipos TypeScript completos
4. Adicionar logs estruturados
5. Testar mentalmente fluxos (mesmo que não escreva testes ainda)
6. Seguir ordem de criação: infra → core → features → docs

---

**Última atualização**: Migração Supabase concluída
**Próxima revisão**: Implementação multi-tenant (futuro)

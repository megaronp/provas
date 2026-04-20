# Test Agent

**Role**: Engenheiro de Qualidade e Testes Automatizados
**Priority**: 4 (valida após features implementadas)
**Permissions**: Full-access a pasta `tests/` (a ser criada), read-only a `src/`

---

## Responsabilidades

### Core Duties
1. Escrever testes unitários para repositories, services, validators
2. Escrever testes de integração para APIs (request/response)
3. Escrever testes E2E (user flows completos)
4. Configurar runner de testes (Jest/Vitest)
5. Gerar reports de cobertura
6. Manter pipeline CI (GitHub Actions)
7. Smoke tests manually quando necessários

### Specific Tasks
- [ ] Criar estrutura `tests/` (unit/, integration/, e2e/)
- [ ] Configurar Jest + supertest + ts-jest
- [ ] Escrever testes para `ProvaRepository`
- [ ] Escrever testes para `adminRoutes` e `studentRoutes`
- [ ] Criar mocks do Supabase (para tests sem DB real)
- [ ] Validar schemas com tests
- [ ] Coverage reports (>70% goal)
- [ ] CI workflow (.github/workflows/ci.yml)

---

## Boundaries (O que NÃO faz)

- ❌ Não implementa código de produção (só testes)
- ❌ Não aprova arquitetura (Architect faz)
- ❌ Não gerencia releases (Orchestrator)
- ❌ Não fix bugs (pode reportar, mas não corrige em production code)
- ❌ Não testa manualmente em produção (só automático)

---

## Skills & Tools

### Primary
- `run_tests` - Executar suite de testes
- `apply_change` - Criar/modificar arquivos de teste
- `search_code` - Encontrar functions para testar

### Secondary
- `commit_changes` - Commitar testes
- `search_web` - Pesquisar patterns de teste

---

## Context Files

### Configuration
- `package.json` - Para adicionar dependências de teste
- `tsconfig.json` - Para configuração do ts-jest
- `src/server.ts` - Para criar test server (supertest)

### Source to Test
- `src/db/provaRepository.ts`
- `src/db/respostaRepository.ts`
- `src/admin/adminRoutes.ts`
- `src/student/studentRoutes.ts`
- `src/utils/validators.ts`

### Future Test Files
```
tests/
├── unit/
│   ├── provaRepository.test.ts
│   ├── respostaRepository.test.ts
│   └── validators.test.ts
├── integration/
│   ├── adminRoutes.test.ts
│   ├── studentRoutes.test.ts
│   └── auth.test.ts
├── e2e/
│   ├── criar-prova.spec.ts
│   ├── submeter-prova.spec.ts
│   └── login-admin.spec.ts
├── setup.ts              # Configuração global de testes
└── mocks/
    ├── supabaseMock.ts
    └── requestMock.ts
```

---

## Testing Framework Choice

### Recommended: Jest + Supertest + ts-jest

**Rationale**:
- Amplamente adopted no ecossistema Node.js
- Assertions + runners + mocking integrados
- TypeScript support via `ts-jest`
- Supertest para HTTP assertions

### Installation
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Config (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json']
};
```

### Script in package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Test Patterns

### 1. Unit Test (Repository)
```typescript
// tests/unit/provaRepository.test.ts
import { ProvaRepository } from "../../src/db/provaRepository";
import { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 1, titulo: "Test" } })
  }))
} as unknown as SupabaseClient;

describe("ProvaRepository", () => {
  let repo: ProvaRepository;

  beforeEach(() => {
    repo = new ProvaRepository(mockSupabase);
  });

  test("deve criar prova com sucesso", async () => {
    const dados = { titulo: "Prova Test", data_inicio: "2025-01-01", data_fim: "2025-12-31" };
    const result = await repo.create(dados);

    expect(result).toHaveProperty("id");
    expect(result.titulo).toBe("Prova Test");
  });

  test("deve retornar null se prova não existe", async () => {
    mockSupabase.from().single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const result = await repo.findById(999);

    expect(result).toBeNull();
  });
});
```

### 2. Integration Test (API Route)
```typescript
// tests/integration/adminRoutes.test.ts
import request from "supertest";
import express from "express";
import { adminRoutes } from "../../src/admin/adminRoutes";
import { ProvaRepository } from "../../src/db/provaRepository";

// Mock repository
jest.mock("../../src/db/provaRepository");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);

describe("POST /api/admin/provas", () => {
  test("deve retornar 201 quando prova criada", async () => {
    const mockProva = { id: 1, titulo: "Nova Prova", status: "draft" };
    (ProvaRepository as any).mockImplementation(() => ({
      create: jest.fn().mockResolvedValue(mockProva)
    }));

    const response = await request(app)
      .post("/api/admin/provas")
      .send({ titulo: "Nova Prova", data_inicio: "2025-01-01", data_fim: "2025-12-31", questoes: [] });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
  });

  test("deve retornar 400 se.title faltar", async () => {
    const response = await request(app)
      .post("/api/admin/provas")
      .send({ data_inicio: "2025-01-01" }); // sem titulo

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### 3. E2E Test (User Flow)
```typescript
// tests/e2e/criar-prova.spec.ts
import { test, expect } from "@playwright/test";

test("Admin deve criar prova completa", async ({ page }) => {
  // 1. Login (se necessário)
  await page.goto("/admin");
  await page.fill("#email", "admin@prova.com");
  await page.fill("#password", "senha123");
  await page.click("button[type='submit']");

  // 2. Navigate to provas page
  await page.click("a[href='/admin/provas']");

  // 3. Click "Nova Prova"
  await page.click("button:has-text('Nova Prova')");

  // 4. Fill form
  await page.fill("#titulo", "Prova E2E Test");
  await page.fill("#data_inicio", "2025-01-01");
  await page.fill("#data_fim", "2025-12-31");

  // 5. Submit
  await page.click("button[type='submit']");

  // 6. Assert success toast
  await expect(page.locator(".toast")).toContainText("Prova criada com sucesso");
});
```

---

## Test Data Management

### Fixtures (unit/integration)
```typescript
// tests/fixtures/prova.fixture.ts
export const provaFactory = (overrides = {}) => ({
  id: 1,
  titulo: "Prova Padrão",
  descricao: "Descrição padrão",
  data_inicio: "2025-01-01T00:00:00Z",
  data_fim: "2025-12-31T23:59:59Z",
  status: "active",
  questoes: [],
  ...overrides
});
```

### Mocking Supabase
```typescript
// tests/mocks/supabaseMock.ts
export const createSupabaseMock = (overrides = {}) => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 1, ...overrides },
      error: null
    })
  }))
});
```

---

## Test Organization

### Structure
```
tests/
├── unit/                    # Teste unidades isoladas
│   ├── repositories/
│   │   ├── provaRepository.test.ts
│   │   └── respostaRepository.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   └── formatters.test.ts
│   └── models/
├── integration/             # Teste de integração (API)
│   ├── adminRoutes.test.ts
│   ├── studentRoutes.test.ts
│   └── middlewares.test.ts
├── e2e/                     # Testes de fluxo completo
│   ├── login-flow.spec.ts
│   ├── criar-prova.spec.ts
│   └── submeter-resposta.spec.ts
├── fixtures/                # Dados de teste reutilizáveis
├── mocks/                   # Mocks de dependências externas
└── setup.ts                 # Configuração global
```

### Naming Convention
- `*.test.ts` - Unit/integration
- `*.spec.ts` - E2E (Playwright convention)
- Descriptions: clear, behavior-driven ("deve retornar erro se email inválido")

---

## Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| Repositories | 80% | 0% |
| Routes | 70% | 0% |
| Utils | 90% | 0% |
| Validators | 90% | 0% |
| **Overall** | **70%** | **0%** |

### Gerar coverage
```bash
npm run test:coverage
# Output: coverage/ (HTML report)
```

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: coverage-report
          path: coverage/
```

---

## Test Strategy by Layer

### Unit Tests
- Test each function in isolation
- Mock external dependencies (Supabase, DB)
- Fast execution (<1s per file)
- Cover edge cases, error scenarios

### Integration Tests
- Test full request/response cycle
- Use test database or mock Supabase at HTTP level
- Cover API contracts, status codes, payloads

### E2E Tests
- Browser automation (Playwright recommended)
- Cover critical user journeys:
  1. Admin login → create prova → add questões → view
  2. Student → list provas → submit answers → view result
- Run less frequently (nightly or on PR)

---

## Mocking Strategy

### Supabase Mock
```typescript
// Supõe-se: src/utils/errors.ts exists
import { SupabaseClient } from "@supabase/supabase-js";

const mockSupabase = {
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase
}));
```

### Request Context
```typescript
// Mock req/res objects
const mockRequest = (user?: any) => ({
  user,
  body: {},
  params: {},
  query: {}
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};
```

---

## Running Tests

### Development
```bash
npm run test:watch        # Watch mode
npm run test -- -t "create prova"  # Single test
```

### CI/CD
```bash
npm ci                    # Install frozen
npm run lint              # ESLint check
npm run test              # All tests
npm run test:coverage     # With coverage report
```

---

## Common Test Scenarios

### ProvaRepository
- [x] `create()` - deve retornar prova com ID
- [x] `findById()` - deve retornar prova ou null
- [x] `findById()` - deve lançar NotFoundError se not found + throw
- [x] `update()` - deve atualizar campos
- [x] `delete()` - deve remover prova
- [x] `listAtivas()` - deve retornar apenas provas ativas em período

### adminRoutes
- [x] POST `/provas` - 201 created com dados válidos
- [x] POST `/provas` - 400 se dados inválidos
- [x] GET `/provas` - 200 com lista
- [x] DELETE `/provas/:id` - 204 se deletado
- [x] DELETE `/provas/:id` - 404 se não existe

### studentRoutes
- [x] GET `/provas/disponiveis` - apenas provas ativas no período
- [x] POST `/provas/:id/submeter` - 201 se submissão OK
- [x] POST `/provas/:id/submeter` - 409 se já submeteu
- [x] GET `/resultados/:id` - 200 com notas

---

## Debugging Failed Tests

1. `console.log` dentro do teste (remover depois)
2. `--verbose` flag para mais detalhes
3. `--detectOpenHandles` se tests travam
4. Inspecionar `error.message` em `expect().rejects`

---

## When to Add Tests

- **Immediately after** feature implementation (Backend/Frontend)
- **Before** bug fix (reproduce bug as test)
- **Before** refactor (protect against regression)

---

## Test Agent Workflow

1. Backend/Frontend completa feature → notifica Test agent via Orchestrator
2. Test agent analisa código → escreve testes apropriados
3. Executa `npm test` → verifica coverage
4. Se passando: commita testes
5. Se falhando: reporta bug para responsible agent

---

## Quality Gates

- PR blocked se:
  - Coverage < 60%
  - Tests break existing functionality
  - No tests for new features (exceto trivial changes)
  - Flaky tests (scheduled investigation)

---

### Future Enhancements
- Property-based testing (fast-check)
- Mutation testing (Stryker)
- Visual regression (Percy)
- Load testing (k6)

---

**Agente #5** - Responsável por qualidade automatizada e CI/CD

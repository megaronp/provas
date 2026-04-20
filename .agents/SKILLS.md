# Skills - ProvaSystem

Este catálogo define as Skills (habilidades) disponíveis para os agentes. Cada skill é uma ferramenta específica que pode ser invocada para realizar operações.

---

## Tipos de Skills

### File Operations
| Skill | Descrição | Usage |
|-------|-----------|-------|
| `read_file` | Ler conteúdo completo de arquivo | `read_file("src/server.ts")` |
| `apply_change` | Aplicar modificação (string replace) | `apply_change("file.ts", old, new)` |
| `write` | Criar novo arquivo (cautela!) | `write("new.ts", content)` |

### Code Analysis
| Skill | Descrição | Usage |
|-------|-----------|-------|
| `search_code` | Buscar padrão regex no código | `search_code("class ProvaRepository")` |
| `grep` | Buscar texto exato (mais rápido) | `grep("TODO")` |
| `glob` | Listar arquivos por padrão | `glob("**/*.test.ts")` |

### Quality & Validation
| Skill | Descrição | Usage |
|-------|-----------|-------|
| `run_lint` | Executar linter (ESLint) | `run_lint()` |
| `run_tests` | Executar testes unitários/e2e | `run_tests()` |

### Version Control & Deployment
| Skill | Descrição | Usage |
|-------|-----------|-------|
| `commit_changes` | Criar git commit | `commit_changes("feat: add ...")` |
| `create_pr` | Criar Pull Request (GitHub) | `create_pr(title, body)` |
| `run_command` | Executa comando bash (com permissão) | `run_command("npm run build")` |

### Research
| Skill | Descrição | Usage |
|-------|-----------|-------|
| `search_web` | Buscar na internet (docs, exemplos) | `search_web("Supabase insert multiple rows")` |
| `webfetch` | Fetch URL específica | `webfetch("https://...")` |

---

## Skill Specifications

### 1. `read_file`

**Purpose**: Ler conteúdo de arquivo existente

**Signature**:
```typescript
read_file(filePath: string): Promise<FileContent>
```

**Returns**:
```typescript
{
  content: string,           // Conteúdo completo
  size: number,              // Tamanho em bytes
  modified: Date             // Última modificação
}
```

**Constraints**:
- Apenas arquivos dentro do projeto
- Max 50 arquivos lidos simultaneamente (evitar context overflow)
- Binários retornam erro

**Example Usage**:
```
Backend agent: read_file("src/db/provaRepository.ts")
→ Retorna conteúdo para análise
```

---

### 2. `apply_change`

**Purpose**: Modificar arquivo existente (string replacement)

**Signature**:
```typescript
apply_change(
  filePath: string,
  oldString: string,
  newString: string,
  options?: { replaceAll?: boolean }
): Promise<ChangeResult>
```

**Returns**:
```typescript
{
  success: boolean,
  modified: boolean,         // True se alteração ocorreu
  matches: number           // Número de ocorrências encontradas
}
```

**Constraints**:
- `oldString` deve ser único no arquivo (senão erro)
- Indentação deve ser EXATA (tabs vs spaces)
- Sempre fazer backup mental (ler file antes)

**Example**:
```
apply_change("src/server.ts", "PORT 3000", "PORT 3001")
→ Altera porta padrão
```

---

### 3. `write`

**Purpose**: Criar novo arquivo (USAR COM CAUTELA)

**Signature**:
```typescript
write(filePath: string, content: string): Promise<WriteResult>
```

**Constraints**:
- Arquivo não deve existir (fail se sim)
- Cria diretórios automaticamente
- Sempre confirmar com Orchestrator antes

**Policy**: **RARE** - Agents preferem `apply_change` em existentes

---

### 4. `search_code`

**Purpose**: Buscar padrões regex no código

**Signature**:
```typescript
search_code(
  pattern: string,
  options?: { path?: string, filePattern?: string }
): Promise<SearchResults>
```

**Returns**:
```typescript
{
  files: [
    {
      path: string,
      matches: Array<{ line: number, text: string }>
    }
  ]
}
```

**Example**:
```
search_code("class ProvaRepository", { filePattern: "*.ts" })
→ Retorna todos files com essa class
```

---

### 5. `grep` & `glob`

**Purpose**: Search utilitários rápidos

**grep**:
```
grep("TODO") → lista todos TODOs no projeto
grep("FIXME", { path: "src/" })
```

**glob**:
```
glob("**/*.test.ts") → todos arquivos de teste
glob("src/**/*.ts") → todos TypeScript em src/
```

---

### 6. `run_lint`

**Purpose**: Verificar qualidade de código

**Signature**:
```typescript
run_lint(
  options?: { fix?: boolean, files?: string[] }
): Promise<LintResult>
```

**Returns**:
```typescript
{
  success: boolean,
  errors: Array<{ file: string, line: number, message: string }>,
  warnings: Array<...>
}
```

**Automatically Fix**:
- `run_lint({ fix: true })` → auto-fixable issues

---

### 7. `run_tests`

**Purpose**: Executar testes automatizados

**Signature**:
```typescript
run_tests(
  options?: { watch?: boolean, coverage?: boolean, pattern?: string }
): Promise<TestResult>
```

**Returns**:
```typescript
{
  success: boolean,
  total: number,
  passed: number,
  failed: number,
  skipped: number,
  coverage?: { lines: number, functions: number }
}
```

**Examples**:
```
run_tests()                         # Todos testes
run_tests({ pattern: "provaRepository" })  # Apenas matching
run_tests({ coverage: true })       # Com coverage
```

---

### 8. `commit_changes`

**Purpose**: Criar commit Git

**Signature**:
```typescript
commit_changes(
  message: string,
  options?: { files?: string[], amend?: boolean }
): Promise<CommitResult>
```

**Commit Message Format**:
```
<agent>(<scope>): <subject>

<body>

Closes #123
```

**Example**:
```
commit_changes("backend(provas): add date validation")
→ Commita todas mudanças pendentes
```

**Constraints**:
- Deve estar em git repo
- Executa `git add .` automaticamente
- Não commita se tests falham (blocked)

---

### 9. `create_pr`

**Purpose**: Abrir Pull Request no GitHub

**Signature**:
```typescript
create_pr(
  title: string,
  body: string,
  options?: { base?: string, draft?: boolean }
): Promise<PRResult>
```

**Returns**:
```typescript
{
  url: string,           # URL do PR
  number: number         # Número do PR
}
```

**Usage**:
```
create_pr(
  "feat(admin): nova tela de relatórios",
  "Implementa dashboard com gráficos usando Chart.js\n\nCloses #45"
)
```

---

### 10. `search_web`

**Purpose**: Buscar documentação na internet

**Signature**:
```typescript
search_web(
  query: string,
  options?: { numResults?: number, type?: "auto" | "fast" | "deep" }
): Promise<WebResults>
```

**Returns**:
```typescript
{
  results: [
    { title: string, url: string, snippet: string, date?: string }
  ]
}
```

**Use Cases**:
- "Supabase how to create index"
- "Express validation best practices"
- "Bootstrap 5 modal events"

**Limits**: 10 requests/min (rate limit)

---

### 11. `webfetch`

**Purpose**: Buscar conteúdo de URL específica

**Signature**:
```typescript
webfetch(
  url: string,
  format?: "markdown" | "text" | "html"
): Promise<FetchedContent>
```

**Use Cases**:
- Ler documentação de uma lib específica
- Verificar changelog de versão
- Baixar exemplo de código

**Constraints**:
- Timeout 30s
- User-Agent identificado como Kilo agent

---

## Skill Permissions Matrix

| Skill | Architect | Backend | Frontend | Database | Test | Orchestrator |
|-------|-----------|---------|----------|----------|------|--------------|
| read_file | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| apply_change | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| write | ✅ (green) | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| search_code | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| grep/glob | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| run_lint | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| run_tests | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| commit_changes | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_pr | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| run_command | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ |
| search_web | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ |
| webfetch | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ |

**Legend**:
- ✅ Full access
- ⚠️ With restrictions/approval
- ❌ No access

---

## Skill Chains (Common Combinations)

### Feature Implementation
1. `read_file` (understand existing)
2. `search_code` (find related patterns)
3. `apply_change` (write code)
4. `run_lint` (validate format)
5. `run_tests` (verify correctness)
6. `commit_changes` (save changes)

### Research & Implement
1. `search_web` (find solution)
2. `read_file` (check compatibility)
3. `apply_change` (implement)
4. `run_tests` (verify)

### Debugging
1. `search_code` (find where bug manifest)
2. `read_file` (read relevant code)
3. `apply_change` (fix bug)
4. `run_tests` (verify fix)

---

## Skill Execution Limits

- **Rate limits**:
  - `search_web`: 10/min
  - `run_tests`: 5/hour (slow)
  - `commit_changes`: 20/hour

- **Resource limits**:
  - Max files read per session: 50
  - Max files modified per session: 20
  - Test timeout: 5 minutes

---

## Error Handling by Skill

### read_file errors
- `FileNotFoundError`: File doesn't exist
- `BinaryFileError`: Cannot read binary file
- `PermissionError`: No read permission

### apply_change errors
- `MultipleMatchesError`: `oldString` found >1 times
- `NoMatchError`: `oldString` not found
- `ValidationError`: Change would break syntax (AST parse fails)

### run_tests errors
- `TestFailureError`: Tests failed
- `TimeoutError`: Tests took too long
- `SetupError`: Test environment broken

---

## Skill Development (Adding New Skills)

To add a new skill:

1. Define in `SKILLS.md` (este arquivo)
2. Implementar agent handler no agent X que usa
3. Adicionar permissão em `AGENTS.md` se necessário
4. Documentar em `CONVENTIONS.md` guidelines de uso
5. Registrar em `index.json` skills array

---

**Document Status**: V1.0 - 11 skills definidas
**Next**: Implementar skill runners no orquestrador

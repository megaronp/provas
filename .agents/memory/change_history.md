# Change History - ProvaSystem

Log of significant changes made via the agent system. This is the audit trail for the autonomous development process.

---

## Format

| Date | File(s) | Change | Agent | Issue/Ref | Commit Hash |
|------|---------|--------|-------|-----------|-------------|

---

## 2025-04-18

### Agent System Initial Build

| Date | File(s) | Change | Agent | Issue/Ref |
|------|---------|--------|-------|-----------|
| 2025-04-18 22:30 | `.agents/` folder structure | Created all subdirectories (agents/, skills/, memory/, prompts/) | Orchestrator | infra |
| 2025-04-18 22:31 | `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` | Core documentation triad established | Architect | infra |
| 2025-04-18 22:33 | `file_map.md` | Comprehensive file mapping created | Architect | infra |
| 2025-04-18 22:34 | `index.json` | System metadata index generated | Architect | infra |
| 2025-04-18 22:35 | `AGENTS.md` | Agent definitions and roles documented | Orchestrator | infra |
| 2025-04-18 22:35-22:36 | `.agents/agents/*.md` | Created 5 agent spec files (architect, backend, frontend, test, database) | Orchestrator | infra |
| 2025-04-18 22:37 | `SKILLS.md` | Skill catalog with 11 skills documented | Orchestrator | infra |
| 2025-04-18 22:38-22:40 | `.agents/prompts/*.txt` | System prompts for all 5 agents written | Orchestrator | infra |
| 2025-04-18 22:41 | `memory/decisions_log.md` | Decision log initialized | Orchestrator | infra |
| 2025-04-18 22:42 | `memory/known_issues.md` | Known issues catalog created | Orchestrator | infra |
| 2025-04-18 22:43 | `memory/change_history.md` | Change history tracking initiated | Orchestrator | infra |

**Initial Build Complete**: Full `.agents/` infrastructure in place.
- 3 core docs (PROJECT_CONTEXT, ARCHITECTURE, CONVENTIONS)
- 5 agent definitions
- 5 system prompts
- 3 memory files
- 1 index + 1 file map + 1 SKILLS catalog
- **Total**: 21 new files created

---

## 2026-04-19

### Ajuste na Fórmula de Cálculo - Múltipla Escolha

| Date | File(s) | Change | Agent | Issue/Ref |
|------|---------|--------|-------|-----------|
| 2026-04-19 18:48 | `src/correction/corrector.ts` | Atualizada lógica de cálculo para múltipla escolha: não há penalização, apenas deixa de ganhar ponto. Ganha ponto por: correta marcada + errada não marcada | Backend | - |
| 2026-04-19 19:30 | `src/correction/corrector.ts` | Ajuste na fórmula V/F: mesma lógica sem penalização | Backend | - |
| 2026-04-19 20:15 | `public/student/index.html`, `src/models/types.ts` | Lacuna bloco: permitir reutilizar palavras + ordem alfabética + salvar palavras usadas | Backend | - |
| 2026-04-19 20:45 | `src/admin/adminRoutes.ts`, `public/admin/relatorio.html`, `src/db/respostaRepository.ts` | Adicionadas funcionalidades na tela de relatório: recalcular nota e excluir submissão | Backend | - |

**Detalhes das mudanças:**

**1. Fórmula Múltipla Escolha:**
- Cada opção vale: valor_da_questão / número_de_opções
- +1 ponto para cada opção CORRETA MARCADA
- +1 ponto para cada opção ERRADA NÃO MARCADA
- 0 ponto para opção ERRADA MARCADA ou CORRETA NÃO MARCADA
- Mínimo: 0 pontos

**2. Fórmula Verdadeiro/Falso:**
- Cada afirmativa vale: valor / total de afirmativas
- Mesma lógica da múltipla escolha

**3. Lacuna em Bloco:**
- Palavras exibidas em ordem alfabética
- Aluno pode reutilizar a mesma palavra em diferentes lacunas
- Salva as palavras usadas para conferência no relatório

**4. Tela de Relatório:**
- Ícone de recalcular (seta) - recalcula nota da submissão
- Ícone de excluir (lixeira) - remove submissão do banco
- Ambos ao lado do ícone de "ver respostas"

---

Copy this template:

```markdown
| YYYY-MM-DD HH:MM | `file1.ts`, `file2.ts` | Brief description of change | Backend/Database/Frontend/Test/Architect | #issue_number | SHA: abc123 |
```

---

## How to Update

1. **After any agent task completion**: Orchestrator updates this file
2. **For code changes**: Add line with files changed
3. **For decisions**: Also add to `memory/decisions_log.md`
4. **For issues found**: Add to `memory/known_issues.md`

---

**This file is automatically maintained by the Orchestrator agent.**

# Sistema de Provas - Migração Supabase Completa

## ✅ Status

O sistema foi completamente migrado de arquivos JSON para Supabase. Todas as funcionalidades estão operacionais.

## 🗄️ Banco de Dados

### Tabelas criadas no Supabase
- `provas` (id, titulo, disciplina, google_sheet_id, ativa, created_at, updated_at)
- `questoes` (id, prova_id, numero, tipo, subtipo, enunciado, valor, texto_com_lacunas, bloco_palavras, dados JSONB)
- `campos_aluno` (id, prova_id, tipo, label, obrigatorio, opcoes JSONB, ordem)
- `submissoes` (id, prova_id, aluno_dados JSONB, nota_total, nota_maxima, created_at)
- `respostas` (id, submissao_id, questao_id, tipo, dados JSONB)

### Índices
```sql
CREATE INDEX idx_questoes_prova ON questoes(prova_id);
CREATE INDEX idx_submissoes_prova ON submissoes(prova_id);
CREATE INDEX idx_respostas_submissao ON respostas(submissao_id);
```

## ⚙️ Configuração

1. **Supabase**: Execute o SQL schema no Supabase SQL Editor
2. **Variáveis de ambiente**: Edite `.env` com suas credenciais:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=anon_key_do_supabase
   ```
3. **Google Sheets (opcional)**: Configuração em `/admin/config` se quiser backup

## 🚀 Iniciar

```bash
npm install
npm run dev
# ou produção
npm run build && node dist/server.js
```

Acesse: http://192.168.1.227:3100/admin

## 🎯 Fluxo de Uso

### Professor (Admin)
1. **Criar Prova**: Clique "Nova Prova" → título e disciplina → Salvar
2. **Selecionar Prova**: Clique "Abrir Prova" → selecione → ícone de check
3. **Adicionar Questões**: Botão "Adicionar Questão" → preencher formulário
4. **Editar Campos Aluno**: Botão "Editar Campos" → arrastar/editar
5. **Ativar Prova**: Botão "Ativar Prova" (só após adicionar questões)
6. **Relatórios**: Aba "Relatórios" → selecione prova → gerar CSV

### Aluno (Student)
1. Acessar `/` (área do aluno)
2. Selecionar prova ativa
3. Preencher formulário e responder questões
4. Submeter → nota instantly calculada

## 📊 Melhorias Implementadas

### Correções de Bugs
- ✅ Questões agora aparecem corretamente no dashboard após adição
- ✅ Recarregar página mantém a prova selecionada (carrega do Supabase)
- ✅ Submissões funcionam sem Google Sheets configurado
- ✅ Relatórios calculam médias corretamente usando o corrector

### Performance & UX
- ✅ Loading states em todos os botões (spinner animado)
- ✅ Overlay global de loading durante init
- ✅ Proteção contra erros em renderQuestoes (try-catch)
- ✅ Logs de debug no console do navegador

### Backend
- ✅ Removida obrigatoriedade de `googleSheetId`
- ✅ Campos padrão now usam UUIDs
- ✅ Cache de relations carregado (questões + campos)
- ✅ Supabase como única fonte de verdade

## 🐛 Diagnóstico

Se as questões não aparecerem no dashboard:

1. Abra o console do navegador (F12)
2. Verifique se há mensagens "Renderizando questões: N"
3. Se `N=0` mas a sidebar mostra número maior, pode ser cache – force recarga (Ctrl+Shift+R)
4. Verifique se há erros 500 no Network tab

## 📝 Estrutura de Arquivos

```
src/
├── db/
│   ├── supabaseClient.ts    # Cliente Supabase
│   ├── provaRepository.ts   # CRUD provas/questoes/campos
│   └── respostaRepository.ts # Submissões e respostas
├── admin/
│   └── adminRoutes.ts       # Rotas do painel admin
├── student/
│   └── studentRoutes.ts     # Rotas do aluno
├── reports/
│   └── reportService.ts     # Relatórios (lê do Supabase)
├── correction/
│   └── corrector.ts         # Lógica de correção
├── models/
│   └── types.ts             # Interfaces TypeScript
└── server.ts                # Express app
```

## 🔄 Endpoints Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/provas` | Lista todas provas completas |
| GET | `/admin/prova` | Retorna prova ativa |
| GET | `/admin/prova/:id` | Retorna prova específica |
| POST | `/admin/prova` | Criar prova |
| PUT | `/admin/prova` | Atualizar prova ativa |
| DELETE | `/admin/prova/:id` | Apagar prova |
| POST | `/admin/prova/:id/selecionar` | Selecionar prova ativa |
| POST | `/admin/questao` | Adicionar questão |
| PUT | `/admin/questao/:id` | Atualizar questão |
| DELETE | `/admin/questao/:id` | Remover questão |
| PUT | `/admin/campos-aluno` | Atualizar campos do aluno |
| POST | `/admin/ativar` | Ativar prova |
| POST | `/admin/desativar` | Desativar prova |
| GET | `/admin/relatorio/:id` | Obter relatório JSON |
| GET | `/admin/relatorio/:id/csv` | Exportar CSV |
| GET | `/api/provas-ativas` | Lista provas ativas (aluno) |
| GET | `/api/prova` | Prova ativa para aluno |
| POST | `/api/submeter` | Submeter resposta |

## 📚 Tipos de Questão Suportados

- `multipla` - múltipla escolha (várias corretas)
- `multipla-simples` - única resposta correta
- `vf` - Verdadeiro/Falso
- `lacuna` - Preencher lacunas (opções ou bloco)

## 🔧 Notas Técnicas

- **Node.js**: 18+ (recomendado 20+ para Supabase)
- **Supabase JS**: 2.x
- **Frontend**: Vanilla JS + Bootstrap 5.3
- **Banco**: PostgreSQL via Supabase

## 📄 Licença

Projeto proprietário.

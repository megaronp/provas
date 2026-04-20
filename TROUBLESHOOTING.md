# Guia de Solução de Problemas - Prova System

## 🔍 Se as questões não aparecem no dashboard

### 1. Abra o console do navegador (F12)
- Clique na aba **Console**
- Procure por mensagens em vermelho ou logs iniciando com `Init:`, `renderSidebar:`, `Renderizando questões:`

### 2. Verifique os logs

Deve aparecer:
```
Init: carregando prova...
Init: prova carregada: {id: "...", titulo: "...", questoes: [...]}
renderSidebar: prova = {id: "...", ...}
Renderizando questões: N
```

**Caso apareça:**
- `Init: prova carregada: null` → Não há prova ativa no Supabase. Você precisa **selecionar** uma prova.
- `Renderizando questões: 0` → A prova ativa não tem questões. Adicione questões primeiro.
- Erro `Failed to fetch` → O servidor não está rodando ou URL errada.

### 3. Soluções rápidas

#### Problema: "Nenhuma prova" no sidebar
**Causa:** Nenhuma prova está ativa.

**Solução:**
1. Clique em **"Abrir Prova"** no sidebar
2. Selecione uma prova da lista (ícone de check)
3. A sidebar deve atualizar mostrando o título da prova

#### Problema: Questões não aparecem após adicionar
**Causa:** A prova selecionada não é a ativa no banco, ou houve erro no salvamento.

**Solução:**
1. Verifique o console: se há erro 500 ou mensagem "Erro na operação"
2. Clique no botão de **Recarregar** (⟳) no topo direito
3. Se persistir, verifique se a prova está realmente ativa:
   ```bash
   curl http://192.168.1.227:3100/admin/prova | python3 -m json.tool | grep -A5 '"questoes"'
   ```

## ⚡ Lentidão

### Causas comuns:
1. **Primeiro carregamento** - Carrega todas as provas com questões e campos. Pode demorar se houver muitas provas.
2. **Supabase lento** - Verifique a conexão com o Supabase

### Melhorias implementadas:
- ✅ Loading spinner global durante init
- ✅ Loading nos botões de ação
- ✅ Overlay escuro enquanto carrega

Se continuar lento após o carregamento inicial, pode ser problema de conexão com o Supabase. Teste:

```bash
time curl -s http://192.168.1.227:3100/admin/provas | python3 -m json.tool > /dev/null
```

Deverá retornar em < 1s.

## 📋 Checklist de verificação

- [ ] Servidor rodando: `ps aux | grep node | grep dist/server.js`
- [ ] Porta 3100 livre: `lsof -ti:3100`
- [ ] `.env` configurado com `SUPABASE_URL` e `SUPABASE_KEY`
- [ ] Tabelas criadas no Supabase (SQL executado)
- [ ] Console sem erros (F12)
- [ ] Hard refresh: Ctrl+Shift+R (limpa cache)

## 🚀 Comandos úteis

```bash
# Verificar se servidor está respondendo
curl -s http://192.168.1.227:3100/admin/provas | head -c 200

# Ver logs do servidor (se rodando em background com nohup)
tail -f /tmp/prova-server.log

# Parar servidor
pkill -f "node dist/server.js"

# Iniciar em desenvolvimento
npm run dev

# Build
npm run build
```

## 🐛 Bugs conhecidos e workarounds

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Sidebar mostra "Nenhuma prova" | Nenhuma prova ativa | Clique em "Abrir Prova" e selecione |
| Questões não aparecem após adicionar | Prova não foi recarregada | Clique no botão ⟳ Recarregar no topo |
| Botões congelados | Requisição pendente | Aguarde o loading sumir |
| Erro 500 ao criar questão | Prova inativa | Ative a prova primeiro (botão "Ativar Prova") |

## 📞 Suporte

Se o problema persistir:
1. Tire um screenshot da tela
2. Copie os logs do console (F12 → Console)
3. Verifique a resposta da API:
   ```bash
   curl -s http://192.168.1.227:3100/admin/prova
   ```

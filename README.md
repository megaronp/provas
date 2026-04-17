# 📋 ProvaSystem v2.0

Sistema web local para criação, aplicação e correção automática de provas, com exportação para Google Sheets.

---

## 🚀 Instalação

```bash
cd prova-system
npm install
```

---

## ▶️ Rodar

```bash
npm run dev
```

- **Professor / Editor:** http://localhost:3000/admin
- **Professor / Relatórios:** http://localhost:3000/admin/relatorio
- **Aluno:** http://localhost:3000

---

## ⚙️ Configurar Google Sheets (uma única vez)

### 1. Google Cloud Console
1. Acesse https://console.cloud.google.com e crie um projeto
2. Ative a **Google Sheets API** em *APIs e Serviços → Biblioteca*

### 2. Service Account
1. Vá em *APIs e Serviços → Credenciais → Criar credenciais → Conta de serviço*
2. Dê um nome e clique em Criar
3. Abra a conta criada → aba **Chaves** → Adicionar chave → JSON
4. Salve o arquivo como `credentials/google-key.json` neste projeto

### 3. Compartilhar a planilha
1. Crie uma planilha em https://sheets.google.com
2. Abra o `google-key.json` e copie o campo `client_email`
3. Compartilhe a planilha com esse e-mail como **Editor**
4. Copie o ID da planilha da URL: `docs.google.com/spreadsheets/d/**ID**/edit`

---

## 📖 Fluxo de Uso

### Professor
1. Acesse `/admin` → **Nova Prova** (título, disciplina, ID da planilha)
2. **Editar Campos** → configure os campos do formulário do aluno
3. **Adicionar Questão** → escolha o tipo e configure
4. Clique em **Ativar Prova**
5. Acesse `/admin/relatorio` para ver resultados e exportar

### Aluno
1. Acesse `/`
2. Preencha o formulário de identificação
3. Responda as questões (pode navegar livremente)
4. Na última questão → **Revisar e Enviar**
5. Confirme o envio → nota exibida na tela

---

## 📊 Tipos de Questão e Pontuação

| Tipo | Pontuação |
|------|-----------|
| Múltipla Escolha | Proporcional pelas corretas marcadas; **0 se marcar qualquer errada** |
| Verdadeiro/Falso | Proporcional por item; **resposta errada desconta** (mínimo 0) |
| Preencher Lacunas | Proporcional por lacuna correta |

---

## 💾 Persistência de Dados

- Cada prova é salva em `data/provas/<id>.json`
- O ponteiro da prova ativa fica em `data/prova_ativa.json`
- **Os arquivos de prova nunca são apagados automaticamente** — só o professor pode apagar via interface
- O build (`npm run build`) não afeta a pasta `data/`

---

## 🗂️ Estrutura

```
prova-system/
├── src/
│   ├── server.ts
│   ├── models/types.ts
│   ├── admin/adminRoutes.ts
│   ├── student/studentRoutes.ts
│   ├── correction/corrector.ts
│   ├── sheets/sheetsService.ts
│   └── reports/reportService.ts
├── public/
│   ├── admin/index.html       ← Painel do professor
│   ├── admin/relatorio.html   ← Relatórios
│   └── student/index.html     ← Área do aluno
├── data/
│   ├── provas/                ← Arquivos permanentes das provas
│   └── prova_ativa.json       ← Ponteiro da prova ativa
├── credentials/
│   └── google-key.json        ⚠️ NÃO commitar
├── package.json
└── tsconfig.json
```

---

## ⚠️ Segurança

- Nunca commite `credentials/` no git
- O arquivo `credentials/` está no `.gitignore`

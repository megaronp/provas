import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Prova, Questao, CampoAluno } from '../models/types';
import { buscarResultadosDaSheet, calcularRelatorio, gerarCSV } from '../reports/reportService';

const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const PROVAS_DIR = path.join(DATA_DIR, 'provas');
const PROVA_ATIVA_PATH = path.join(DATA_DIR, 'prova_ativa.json');

// Garante diretórios
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PROVAS_DIR)) fs.mkdirSync(PROVAS_DIR, { recursive: true });

function provaPath(id: string) {
  return path.join(PROVAS_DIR, `${id}.json`);
}

function salvarProva(prova: Prova): void {
  fs.writeFileSync(provaPath(prova.id), JSON.stringify(prova, null, 2));
  const ativaData = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
  fs.writeFileSync(PROVA_ATIVA_PATH, JSON.stringify({ ...ativaData, id: prova.id }, null, 2));
}

function carregarProva(id?: string): Prova | null {
  try {
    if (id) {
      const p = provaPath(id);
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    // Carrega a ativa
    if (!fs.existsSync(PROVA_ATIVA_PATH)) return null;
    const { id: activeId } = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    return carregarProva(activeId);
  } catch {
    return null;
  }
}

function listarTodasProvas(): Prova[] {
  if (!fs.existsSync(PROVAS_DIR)) return [];
  return fs.readdirSync(PROVAS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(PROVAS_DIR, f), 'utf-8')); }
      catch { return null; }
    })
    .filter(Boolean)
    .sort((a: Prova, b: Prova) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
}

// ── Páginas HTML ──────────────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'index.html'));
});

router.get('/relatorio', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'relatorio.html'));
});

router.get('/config', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'config.html'));
});

router.get('/config/api', (_req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    res.json({ googleCredentials: data.googleCredentials || '' });
  } catch {
    res.json({ googleCredentials: '' });
  }
});

router.put('/config/api', (req: Request, res: Response) => {
  const { googleCredentials } = req.body;
  try {
    const data = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    data.googleCredentials = googleCredentials || '';
    fs.writeFileSync(PROVA_ATIVA_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Provas ────────────────────────────────────────────────────────────────────

router.get('/provas', (_req: Request, res: Response) => {
  res.json(listarTodasProvas());
});

router.get('/prova', (_req: Request, res: Response) => {
  const prova = carregarProva();
  res.json(prova || null);
});

router.get('/prova/:id', (req: Request, res: Response) => {
  const prova = carregarProva(req.params.id);
  if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });
  res.json(prova);
});

router.post('/prova', (req: Request, res: Response) => {
  const { titulo, disciplina, googleSheetId } = req.body;
  if (!titulo || !disciplina || !googleSheetId) {
    return res.status(400).json({ erro: 'Campos obrigatórios: titulo, disciplina, googleSheetId' });
  }

  const camposPadrao: CampoAluno[] = [
    { id: 'campo-nome', tipo: 'text', label: 'Nome completo', obrigatorio: true, ordem: 0 },
    { id: 'campo-matricula', tipo: 'text', label: 'Matrícula', obrigatorio: true, ordem: 1 },
    { id: 'campo-data', tipo: 'text', label: 'Data', obrigatorio: true, ordem: 2 },
  ];

  const prova: Prova = {
    id: uuidv4(),
    titulo,
    disciplina,
    googleSheetId,
    dataCriacao: new Date().toISOString(),
    questoes: [],
    camposAluno: camposPadrao,
    ativa: false,
  };
  salvarProva(prova);
  res.json(prova);
});

router.put('/prova', (req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });
  const { titulo, disciplina, googleSheetId } = req.body;
  if (titulo) prova.titulo = titulo;
  if (disciplina) prova.disciplina = disciplina;
  if (googleSheetId) prova.googleSheetId = googleSheetId;
  salvarProva(prova);
  res.json(prova);
});

// Apagar prova (apenas desativa o ponteiro, arquivo permanece)
router.delete('/prova/:id', (req: Request, res: Response) => {
  const filePath = provaPath(req.params.id);
  if (!fs.existsSync(filePath)) return res.status(404).json({ erro: 'Prova não encontrada' });
  // Apenas remove o arquivo permanentemente (decisão do professor)
  fs.unlinkSync(filePath);
  // Se era a ativa, limpa o ponteiro
  if (fs.existsSync(PROVA_ATIVA_PATH)) {
    try {
      const { id } = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
      if (id === req.params.id) fs.unlinkSync(PROVA_ATIVA_PATH);
    } catch { /* ignora */ }
  }
  res.json({ ok: true });
});

// Selecionar qual prova é a ativa
router.post('/prova/:id/selecionar', (req: Request, res: Response) => {
  const prova = carregarProva(req.params.id);
  if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });
  fs.writeFileSync(PROVA_ATIVA_PATH, JSON.stringify({ id: prova.id }, null, 2));
  res.json({ ok: true });
});

// ── Questões ──────────────────────────────────────────────────────────────────

router.post('/questao', (req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });

  const questao: Questao = {
    ...req.body,
    id: uuidv4(),
    numero: prova.questoes.length + 1,
  };

  prova.questoes.push(questao);
  salvarProva(prova);
  res.json(questao);
});

router.put('/questao/:id', (req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });

  const idx = prova.questoes.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Questão não encontrada' });

  prova.questoes[idx] = { ...req.body, id: req.params.id, numero: prova.questoes[idx].numero };
  salvarProva(prova);
  res.json(prova.questoes[idx]);
});

router.delete('/questao/:id', (req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });

  prova.questoes = prova.questoes
    .filter(q => q.id !== req.params.id)
    .map((q, i) => ({ ...q, numero: i + 1 }));
  salvarProva(prova);
  res.json({ ok: true });
});

// ── Campos do Aluno ───────────────────────────────────────────────────────────

router.put('/campos-aluno', (req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });
  prova.camposAluno = req.body.campos;
  salvarProva(prova);
  res.json(prova.camposAluno);
});

// ── Ativar / Desativar ────────────────────────────────────────────────────────

router.post('/ativar', (_req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });
  if (prova.questoes.length === 0) return res.status(400).json({ erro: 'Adicione ao menos uma questão' });
  prova.ativa = true;
  salvarProva(prova);
  res.json({ ok: true });
});

router.post('/desativar', (_req: Request, res: Response) => {
  const prova = carregarProva();
  if (!prova) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });
  prova.ativa = false;
  salvarProva(prova);
  res.json({ ok: true });
});

// ── Relatório ─────────────────────────────────────────────────────────────────

router.get('/relatorio/:id', async (req: Request, res: Response) => {
  const prova = carregarProva(req.params.id);
  if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });
  try {
    const resultados = await buscarResultadosDaSheet(prova);
    const relatorio = calcularRelatorio(prova, resultados);
    res.json(relatorio);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/relatorio/:id/csv', async (req: Request, res: Response) => {
  const prova = carregarProva(req.params.id);
  if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });
  try {
    const resultados = await buscarResultadosDaSheet(prova);
    const relatorio = calcularRelatorio(prova, resultados);
    const csv = gerarCSV(relatorio, prova);
    const filename = `relatorio_${prova.titulo.replace(/[^a-z0-9]/gi, '_')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Configurações ───────────────────────────────────────────────────────────────

router.get('/config', (_req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    res.json({ googleCredentials: data.googleCredentials || '' });
  } catch {
    res.json({ googleCredentials: '' });
  }
});

router.put('/config', (req: Request, res: Response) => {
  const { googleCredentials } = req.body;
  try {
    const data = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    data.googleCredentials = googleCredentials || '';
    fs.writeFileSync(PROVA_ATIVA_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;

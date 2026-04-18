import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Prova, Submissao, QuestaoLacuna } from '../models/types';
import { corrigirSubmissao } from '../correction/corrector';
import { salvarResultadoNaSheet } from '../sheets/sheetsService';

const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const PROVAS_DIR = path.join(DATA_DIR, 'provas');
const PROVA_ATIVA_PATH = path.join(DATA_DIR, 'prova_ativa.json');

function carregarProvaAtiva(): Prova | null {
  try {
    if (!fs.existsSync(PROVA_ATIVA_PATH)) return null;
    const { id } = JSON.parse(fs.readFileSync(PROVA_ATIVA_PATH, 'utf-8'));
    const p = path.join(PROVAS_DIR, `${id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function carregarProvaPorId(id: string): Prova | null {
  try {
    const p = path.join(PROVAS_DIR, `${id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function listarProvasAtivas(): { id: string; titulo: string; disciplina: string }[] {
  try {
    if (!fs.existsSync(PROVAS_DIR)) return [];
    const arquivos = fs.readdirSync(PROVAS_DIR).filter(f => f.endsWith('.json'));
    const provas: { id: string; titulo: string; disciplina: string }[] = [];
    for (const arquivo of arquivos) {
      try {
        const prova = JSON.parse(fs.readFileSync(path.join(PROVAS_DIR, arquivo), 'utf-8'));
        if (prova.ativa) {
          provas.push({ id: prova.id, titulo: prova.titulo, disciplina: prova.disciplina });
        }
      } catch { continue; }
    }
    return provas;
  } catch { return []; }
}

router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'student', 'index.html'));
});

router.get('/api/provas-ativas', (_req: Request, res: Response) => {
  const provas = listarProvasAtivas();
  res.json(provas);
});

router.get('/api/prova', (req: Request, res: Response) => {
  const { id } = req.query;
  let prova: Prova | null = null;

  if (id && typeof id === 'string') {
    prova = carregarProvaPorId(id);
  } else {
    prova = carregarProvaAtiva();
  }
  if (!prova || !prova.ativa) {
    return res.status(404).json({ erro: 'Nenhuma prova ativa no momento.' });
  }

  // Remove gabaritos
  const provaAluno = {
    ...prova,
    questoes: prova.questoes.map(q => {
      if (q.tipo === 'multipla') {
        return { ...q, opcoes: q.opcoes.map(({ id, texto }) => ({ id, texto })) };
      }
      if (q.tipo === 'vf') {
        return { ...q, afirmativas: q.afirmativas.map(({ id, texto }) => ({ id, texto })) };
      }
      if (q.tipo === 'lacuna') {
        const lacuna = q as QuestaoLacuna;
        if (lacuna.subtipo === 'bloco') {
          return { ...q, lacunas: lacuna.lacunas.map(({ id, posicao, correta }) => ({ id, posicao, correta })), blocoPalavras: lacuna.blocoPalavras };
        }
        return { ...q, lacunas: lacuna.lacunas.map(({ id, posicao, opcoes }) => ({ id, posicao, opcoes })) };
      }
      return q;
    }),
  };

  res.json(provaAluno);
});

router.post('/api/submeter', async (req: Request, res: Response) => {
  const { provaId, aluno, respostas } = req.body;
  if (!aluno) return res.status(400).json({ erro: 'Dados do aluno ausentes.' });

  let prova: Prova | null = null;
  if (provaId && typeof provaId === 'string') {
    prova = carregarProvaPorId(provaId);
  } else {
    prova = carregarProvaAtiva();
  }
  if (!prova || !prova.ativa) {
    return res.status(404).json({ erro: 'Nenhuma prova ativa.' });
  }

  const submissao: Submissao = {
    id: uuidv4(),
    provaId: prova.id,
    aluno,
    respostas: respostas || [],
    dataEnvio: new Date().toISOString(),
  };

  const resultado = corrigirSubmissao(prova, submissao);

  try {
    await salvarResultadoNaSheet(prova.googleSheetId, prova, resultado, submissao);
  } catch (err: any) {
    console.error('Erro ao salvar no Google Sheets:', err.message);
  }

  res.json(resultado);
});

export default router;

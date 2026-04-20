import { Router, Request, Response } from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Prova, Submissao, QuestaoLacuna } from '../models/types';
import { corrigirSubmissao } from '../correction/corrector';
import { salvarResultadoNaSheet } from '../sheets/sheetsService';
import { buscarProvaPorId, buscarProvaAtiva } from '../db/provaRepository';
import { salvarSubmissao, atualizarNotaSubmissao } from '../db/respostaRepository';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'student', 'index.html'));
});

router.get('/api/provas-ativas', async (_req: Request, res: Response) => {
  try {
    const provas = await buscarProvaAtiva();
    if (!provas) return res.json([]);
    // Retorna array com apenas a prova ativa
    res.json([{
      id: provas.id,
      titulo: provas.titulo,
      disciplina: provas.disciplina
    }]);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/api/prova', async (req: Request, res: Response) => {
  try {
    let prova: Prova | null = null;

    if (req.query.id && typeof req.query.id === 'string') {
      prova = await buscarProvaPorId(req.query.id);
    } else {
      prova = await buscarProvaAtiva();
    }

    if (!prova || !prova.ativa) {
      return res.status(404).json({ erro: 'Nenhuma prova ativa no momento.' });
    }

    // Remove gabaritos
    const provaAluno = {
      ...prova,
      questoes: prova.questoes.map(q => {
        if (q.tipo === 'multipla') {
          return { ...q, opcoes: (q as any).opcoes.map(({ id, texto }: { id: string; texto: string }) => ({ id, texto })) };
        }
        if (q.tipo === 'vf') {
          return { ...q, afirmativas: (q as any).afirmativas.map(({ id, texto }: { id: string; texto: string }) => ({ id, texto })) };
        }
        if (q.tipo === 'lacuna') {
          const lacuna = q as QuestaoLacuna;
          if (lacuna.subtipo === 'bloco') {
            return {
              ...q,
              lacunas: lacuna.lacunas.map(({ id, posicao, correta }: { id: string; posicao: number; correta: string }) => ({ id, posicao, correta })),
              blocoPalavras: lacuna.blocoPalavras
            };
          }
          return { ...q, lacunas: lacuna.lacunas.map(({ id, posicao, opcoes }: { id: string; posicao: number; opcoes: string[] }) => ({ id, posicao, opcoes })) };
        }
        return q;
      }),
    };

    res.json(provaAluno);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/api/submeter', async (req: Request, res: Response) => {
  const { provaId, aluno, respostas } = req.body;
  if (!aluno) return res.status(400).json({ erro: 'Dados do aluno ausentes.' });

  try {
    let prova: Prova | null = null;

    if (provaId && typeof provaId === 'string') {
      prova = await buscarProvaPorId(provaId);
    } else {
      prova = await buscarProvaAtiva();
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

    // Salva no Supabase (com notas por questão)
    await salvarSubmissao(submissao, resultado.resultadosPorQuestao);
    await atualizarNotaSubmissao(submissao.id, resultado.notaTotal, resultado.notaMaxima);

    // Salva no Google Sheets (backup)
    salvarResultadoNaSheet(prova.googleSheetId, prova, resultado, submissao)
      .catch(err => console.error('[Sheets backup failed]', err));

    res.json(resultado);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Prova, Questao, CampoAluno } from '../models/types';
import {
  listarTodasProvas,
  buscarProvaPorId,
  criarProva,
  atualizarProva,
  deletarProva as deletarProvaDB,
  listarQuestoes,
  criarQuestao,
  atualizarQuestao,
  deletarQuestao,
  listarCamposAluno,
  atualizarCamposAluno,
  buscarProvaAtiva
} from '../db/provaRepository';
import {
  salvarSubmissao,
  buscarResultadosPorProva,
  buscarSubmissoesPorProva,
  atualizarNotaSubmissao,
  deletarSubmissao
} from '../db/respostaRepository';
import { corrigirSubmissao } from '../correction/corrector';
import { supabase } from '../db/supabaseClient';
import { invalidate, cache } from '../utils/cache';

const router = Router();

// ── Páginas HTML ────────────────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'index.html'));
});

router.get('/relatorio', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'relatorio.html'));
});

router.get('/config', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'config.html'));
});

// ── Provas ─────────────────────────────────────────────────────────────────────

router.get('/provas', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
    const after = req.query.after ? String(req.query.after) : null;

    // Backward compatibility: if no query params, return all provas as array (legacy)
    if (limit === null && after === null) {
      const provas = await listarTodasProvas();
      res.json(provas);
      return;
    }

    const actualLimit = limit || 20;
    const cursor = after;

    let query = supabase
      .from('provas')
      .select('*')
      .order('id', { ascending: true });

    if (cursor) {
      query = query.gt('id', cursor);
    }

    const { data, error } = await query.limit(actualLimit + 1);

    if (error) throw error;

    const hasNext = data.length > actualLimit;
    const nextCursor = hasNext ? data[actualLimit - 1].id : null;
    const responseData = hasNext ? data.slice(0, actualLimit) : data;

    res.json({
      data: responseData,
      pagination: {
        hasNext,
        nextCursor,
        limit: actualLimit
      }
    });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/prova', async (_req: Request, res: Response) => {
  try {
    const prova = await buscarProvaAtiva();
    res.json(prova || null);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/prova/:id', async (req: Request, res: Response) => {
  try {
    const prova = await buscarProvaPorId(req.params.id);
    if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });
    res.json(prova);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/prova', async (req: Request, res: Response) => {
  const { titulo, disciplina } = req.body;
  if (!titulo || !disciplina) {
    return res.status(400).json({ erro: 'Campos obrigatórios: titulo, disciplina' });
  }

  try {
    const prova = await criarProva(titulo, disciplina);
    res.json(prova);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/prova', async (req: Request, res: Response) => {
  try {
    const { data: activeProva } = await supabase.from('provas').select('id').eq('ativa', true).single();
    const provaIdStr = activeProva?.id || null;
    if (!provaIdStr) return res.status(404).json({ erro: 'Nenhuma prova ativa' });

    const { titulo, disciplina } = req.body;
    const prova = await atualizarProva(provaIdStr, { titulo, disciplina });
    res.json(prova);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});



router.delete('/prova/:id', async (req: Request, res: Response) => {
  try {
    await deletarProvaDB(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/prova/:id/selecionar', async (req: Request, res: Response) => {
  try {
    const prova = await buscarProvaPorId(req.params.id);
    if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });

    // Desativa todas as provas ativas
    await supabase.from('provas').update({ ativa: false }).eq('ativa', true);
    // Ativa a prova selecionada
    await supabase.from('provas').update({ ativa: true }).eq('id', prova.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Questões ───────────────────────────────────────────────────────────────────

router.post('/questao', async (req: Request, res: Response) => {
  const { data: activeProva } = await supabase.from('provas').select('id').eq('ativa', true).single();
  const provaIdStr = activeProva?.id || null;
  if (!provaIdStr) return res.status(404).json({ erro: 'Nenhuma prova ativa' });

  try {
    const questao = await criarQuestao(provaIdStr, req.body);
    res.json(questao);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/questao/:id', async (req: Request, res: Response) => {
  try {
    const questao = await atualizarQuestao(req.params.id, req.body);
    res.json(questao);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/questao/:id/ordenar', async (req: Request, res: Response) => {
  try {
    const { numero } = req.body;
    if (numero === undefined) {
      return res.status(400).json({ erro: 'Número é obrigatório' });
    }
    const questao = await atualizarQuestao(req.params.id, { numero });
    res.json(questao);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/questao/:id', async (req: Request, res: Response) => {
  try {
    await deletarQuestao(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Campos do Aluno ─────────────────────────────────────────────────────────────

router.put('/campos-aluno', async (req: Request, res: Response) => {
  const { data: activeProva } = await supabase.from('provas').select('id').eq('ativa', true).single();
  const provaIdStr = activeProva?.id || null;
  if (!provaIdStr) return res.status(404).json({ erro: 'Nenhuma prova ativa' });

  try {
    const campos: CampoAluno[] = req.body.campos;
    await atualizarCamposAluno(provaIdStr, campos);
    res.json(campos);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Ativar / Desativar ──────────────────────────────────────────────────────────

router.post('/ativar', async (_req: Request, res: Response) => {
  try {
    const { data: activeProva } = await supabase.from('provas').select('id').eq('ativa', true).single();
    const provaIdStr = activeProva?.id || null;
    if (!provaIdStr) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });

    const questoes = await listarQuestoes(provaIdStr);
    if (questoes.length === 0) {
      return res.status(400).json({ erro: 'Adicione ao menos uma questão' });
    }

    await atualizarProva(provaIdStr, { ativa: true });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/desativar', async (_req: Request, res: Response) => {
  try {
    const { data: activeProva } = await supabase.from('provas').select('id').eq('ativa', true).single();
    const provaIdStr = activeProva?.id || null;
    if (!provaIdStr) return res.status(404).json({ erro: 'Nenhuma prova encontrada' });

    await atualizarProva(provaIdStr, { ativa: false });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Relatório ────────────────────────────────────────────────────────────────────

router.get('/relatorio/:id', async (req: Request, res: Response) => {
  try {
    const prova = await buscarProvaPorId(req.params.id);
    if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });

    const { buscarResultadosDaSheet, calcularRelatorio } = require('../reports/reportService');
    const [relatorioBase, resultados] = await Promise.all([
      calcularRelatorio(prova),
      buscarResultadosDaSheet(prova)
    ]);
    const relatorio = { ...relatorioBase, resultados };
    res.json(relatorio);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/submissoes/:provaId', async (req: Request, res: Response) => {
  try {
    const submissoes = await buscarSubmissoesPorProva(req.params.provaId);
    res.json(submissoes);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/submissao/:id/recalcular', async (req: Request, res: Response) => {
  try {
    const { data: submissao } = await supabase
      .from('submissoes')
      .select('*, respostas(*)')
      .eq('id', req.params.id)
      .single();
    
    if (!submissao) return res.status(404).json({ erro: 'Submissão não encontrada' });

    const { data: provaData } = await supabase
      .from('provas')
      .select('*')
      .eq('id', submissao.prova_id)
      .single();
    
    if (!provaData) return res.status(404).json({ erro: 'Prova não encontrada' });

    const prova = await buscarProvaPorId(provaData.id);
    if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });

    const submissaoFormatada = {
      id: submissao.id,
      provaId: submissao.prova_id,
      aluno: submissao.aluno_dados,
      respostas: (submissao.respostas || []).map((r: any) => r.dados),
      dataEnvio: submissao.created_at
    };

    const resultado = corrigirSubmissao(prova, submissaoFormatada);

    await atualizarNotaSubmissao(submissao.id, resultado.notaTotal, resultado.notaMaxima);

    cache.flushAll();

    res.json({ ok: true, notaTotal: resultado.notaTotal, notaMaxima: resultado.notaMaxima });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/submissao/:id', async (req: Request, res: Response) => {
  try {
    await deletarSubmissao(req.params.id);
    cache.flushAll();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/relatorio/:id/csv', async (req: Request, res: Response) => {
  try {
    const prova = await buscarProvaPorId(req.params.id);
    if (!prova) return res.status(404).json({ erro: 'Prova não encontrada' });

    const { buscarResultadosDaSheet, calcularRelatorio, gerarCSV } = require('../reports/reportService');
    const [relatorioBase, resultados] = await Promise.all([
      calcularRelatorio(prova),
      buscarResultadosDaSheet(prova)
    ]);
    const relatorio = { ...relatorioBase, resultados };
    const csv = gerarCSV(relatorio, prova);
    const filename = `relatorio_${prova.titulo.replace(/[^a-z0-9]/gi, '_')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;

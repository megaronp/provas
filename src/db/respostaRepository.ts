import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Submissao, Resultado, Resposta, ResultadoQuestao } from '../models/types';
import { invalidate } from '../utils/cache';

// ── Submissões ──────────────────────────────────────────────────────────────────

export async function salvarSubmissao(submissao: Submissao, resultadosPorQuestao: ResultadoQuestao[]): Promise<void> {
  // Mapeia questaoId -> pontosObtidos
  const notasMap = new Map(resultadosPorQuestao.map(rq => [rq.questaoId, rq.pontosObtidos]));
  const respostasComNota = submissao.respostas.map(r => ({
    questao_id: r.questaoId,
    tipo: r.tipo,
    dados: r,
    nota: notasMap.get(r.questaoId) ?? null
  }));

  const { error } = await supabase.rpc('salvar_submissao_completa', {
    p_id: submissao.id,
    p_prova_id: submissao.provaId,
    p_aluno_dados: submissao.aluno,
    p_respostas: respostasComNota
  });

  if (error) throw error;
}

export async function atualizarNotaSubmissao(
  submissaoId: string,
  notaTotal: number,
  notaMaxima: number
): Promise<void> {
  const { error } = await supabase
    .from('submissoes')
    .update({ nota_total: notaTotal, nota_maxima: notaMaxima })
    .eq('id', submissaoId);

  if (error) throw error;

  await atualizarRelatorioCache();
}

export async function atualizarRelatorioCache(): Promise<void> {
}

export async function deletarSubmissao(submissaoId: string): Promise<void> {
  const { error: errorRespostas } = await supabase
    .from('respostas')
    .delete()
    .eq('submissao_id', submissaoId);

  if (errorRespostas) throw errorRespostas;

  const { error: errorSubmissao } = await supabase
    .from('submissoes')
    .delete()
    .eq('id', submissaoId);

  if (errorSubmissao) throw errorSubmissao;

  await atualizarRelatorioCache();
}

export async function buscarSubmissoesPorProva(provaId: string): Promise<Submissao[]> {
  const { data, error } = await supabase
    .from('submissoes')
    .select(`
      id,
      prova_id,
      aluno_dados,
      nota_total,
      nota_maxima,
      created_at,
      respostas (*)
    `)
    .eq('prova_id', provaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(s => ({
    id: s.id,
    provaId: s.prova_id,
    aluno: s.aluno_dados,
    notaTotal: s.nota_total || 0,
    notaMaxima: s.nota_maxima || 0,
    respostas: (s.respostas || []).map((r: any) => r.dados as Resposta),
    dataEnvio: s.created_at,
  }));
}

export async function buscarResultadosPorProva(provaId: string): Promise<Resultado[]> {
  const { data, error } = await supabase
    .from('submissoes')
    .select(`
      id,
      prova_id,
      aluno_dados,
      nota_total,
      nota_maxima,
      created_at,
      respostas (
        questao_id,
        tipo,
        dados
      )
    `)
    .eq('prova_id', provaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(s => {
    const resultadosPorQuestao = (s.respostas || []).map((r: any) => ({
      questaoId: r.questao_id,
      numero: 0, // será preenchido depois se necessário
      pontosObtidos: 0, // calculado previamente
      valorTotal: 0,
    }));

    return {
      submissaoId: s.id,
      provaId: s.prova_id,
      provaTitle: '', // será preenchido depois
      aluno: s.aluno_dados,
      resultadosPorQuestao,
      notaTotal: s.nota_total || 0,
      notaMaxima: s.nota_maxima || 0,
      dataEnvio: s.created_at,
    };
  });
}

export async function buscarResultadoCompletoPorSubmissao(submissaoId: string): Promise<Resultado | null> {
  const { data, error } = await supabase
    .from('submissoes')
    .select(`
      *,
      respostas (*)
    `)
    .eq('id', submissaoId)
    .single();

  if (error) return null;

  // Precisamos buscar a prova para obter título e valores das questões
  const { data: provaData } = await supabase
    .from('provas')
    .select('titulo, questoes (id, valor)')
    .eq('id', data.prova_id)
    .single();

  const questoesMap = new Map(
    (provaData?.questoes || []).map((q: any) => [q.id, q.valor])
  );

  const resultadosPorQuestao = (data.respostas || []).map((r: any) => ({
    questaoId: r.questao_id,
    numero: 0,
    pontosObtidos: 0, // já está no submissao.nota_total, mas por questão precisamos de cálculo
    valorTotal: questoesMap.get(r.questao_id) || 0,
  }));

  return {
    submissaoId: data.id,
    provaId: data.prova_id,
    provaTitle: provaData?.titulo || '',
    aluno: data.aluno_dados,
    resultadosPorQuestao,
    notaTotal: data.nota_total || 0,
    notaMaxima: data.nota_maxima || 0,
    dataEnvio: data.created_at,
  };
}

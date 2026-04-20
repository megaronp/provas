import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Prova, Questao, CampoAluno } from '../models/types';
import { getCached, invalidate } from '../utils/cache';

export interface ProvaCompleta extends Prova {}

// ── Provas ─────────────────────────────────────────────────────────────────────

export async function listarTodasProvas(): Promise<Prova[]> {
  console.time('listarTodasProvas');
  const { data, error } = await supabase
    .from('provas')
    .select(`
      *,
      questoes (*),
      campos_aluno (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const provasCompletas: Prova[] = (data || []).map((p: any) => {
    const questoesOrdenadas = (p.questoes || []).sort((a: any, b: any) => a.numero - b.numero);
    return {
      id: p.id,
      titulo: p.titulo,
      disciplina: p.disciplina,
      dataCriacao: p.created_at,
      googleSheetId: p.google_sheet_id,
      questoes: questoesOrdenadas.map((q: any) => mapQuestaoFromDB(q)),
      camposAluno: p.campos_aluno ? p.campos_aluno.map((c: any) => ({
        id: c.id,
        tipo: c.tipo,
        label: c.label,
        obrigatorio: c.obrigatorio,
        opcoes: c.opcoes,
        ordem: c.ordem,
      })) : [],
      ativa: p.ativa,
    };
  });

  console.timeEnd('listarTodasProvas');
  return provasCompletas;
}

export async function buscarProvaPorId(id: string): Promise<Prova | null> {
  console.time('buscarProvaPorId');
  const { data, error } = await supabase
    .from('provas')
    .select(`
      *,
      questoes (*),
      campos_aluno (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.timeEnd('buscarProvaPorId');
    return null;
  }

  const questoesOrdenadas = (data.questoes || []).sort((a: any, b: any) => a.numero - b.numero);

  const result = {
    id: data.id,
    titulo: data.titulo,
    disciplina: data.disciplina,
    dataCriacao: data.created_at,
    googleSheetId: data.google_sheet_id,
    questoes: questoesOrdenadas.map((q: any) => mapQuestaoFromDB(q)),
    camposAluno: data.campos_aluno ? data.campos_aluno.map((c: any) => ({
      id: c.id,
      tipo: c.tipo,
      label: c.label,
      obrigatorio: c.obrigatorio,
      opcoes: c.opcoes,
      ordem: c.ordem,
    })) : [],
    ativa: data.ativa,
  };

  console.timeEnd('buscarProvaPorId');
  return result;
}

export async function criarProva(
  titulo: string,
  disciplina: string,
  googleSheetId?: string
): Promise<Prova> {
  const camposPadrao: CampoAluno[] = [
    { id: uuidv4(), tipo: 'text', label: 'Nome completo', obrigatorio: true, ordem: 0 },
    { id: uuidv4(), tipo: 'text', label: 'Matrícula', obrigatorio: true, ordem: 1 },
    { id: uuidv4(), tipo: 'text', label: 'Data', obrigatorio: true, ordem: 2 },
  ];

  const { data, error } = await supabase
    .from('provas')
    .insert({
      titulo,
      disciplina,
      google_sheet_id: googleSheetId || null,
      ativa: false,
    })
    .select()
    .single();

  if (error) throw error;

  const prova: Prova = {
    id: data.id,
    titulo: data.titulo,
    disciplina: data.disciplina,
    dataCriacao: data.created_at,
    googleSheetId: data.google_sheet_id,
    questoes: [],
    camposAluno: camposPadrao,
    ativa: data.ativa,
  };

  // Salva campos padrão
  await atualizarCamposAluno(prova.id, camposPadrao);

  return prova;
}

export async function atualizarProva(
  id: string,
  updates: Partial<Pick<Prova, 'titulo' | 'disciplina' | 'googleSheetId' | 'ativa'>>
): Promise<Prova> {
  const dbUpdates: any = {};
  if (updates.titulo) dbUpdates.titulo = updates.titulo;
  if (updates.disciplina) dbUpdates.disciplina = updates.disciplina;
  if (updates.googleSheetId) dbUpdates.google_sheet_id = updates.googleSheetId;
  if (updates.ativa !== undefined) dbUpdates.ativa = updates.ativa;

  const { data, error } = await supabase
    .from('provas')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (data.ativa === true) {
    invalidate('prova-ativa');
  }
  invalidate(`questoes:${id}`);

  return data as any;
}

export async function deletarProva(id: string): Promise<void> {
  // Cascade delete para questoes, campos, submissoes e respostas
  const { error } = await supabase
    .from('provas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function buscarProvaAtiva(): Promise<Prova | null> {
  return getCached('prova-ativa', async () => {
    console.time('buscarProvaAtiva');
    const { data, error } = await supabase
      .from('provas')
      .select(`
        *,
        questoes (*),
        campos_aluno (*)
      `)
      .eq('ativa', true)
      .limit(1)
      .single();

    if (error || !data) {
      console.timeEnd('buscarProvaAtiva');
      return null;
    }

    const questoesOrdenadas = (data.questoes || []).sort((a: any, b: any) => a.numero - b.numero);

    const result = {
      id: data.id,
      titulo: data.titulo,
      disciplina: data.disciplina,
      dataCriacao: data.created_at,
      googleSheetId: data.google_sheet_id,
      questoes: questoesOrdenadas.map((q: any) => mapQuestaoFromDB(q)),
      camposAluno: data.campos_aluno ? data.campos_aluno.map((c: any) => ({
        id: c.id,
        tipo: c.tipo,
        label: c.label,
        obrigatorio: c.obrigatorio,
        opcoes: c.opcoes,
        ordem: c.ordem,
      })) : [],
      ativa: data.ativa,
    };

    console.timeEnd('buscarProvaAtiva');
    return result;
  }, { ttl: 30 });
}

// ── Questões ────────────────────────────────────────────────────────────────────

export async function listarQuestoes(provaId: string): Promise<Questao[]> {
  return getCached(`questoes:${provaId}`, async () => {
    const { data, error } = await supabase
      .from('questoes')
      .select('*')
      .eq('prova_id', provaId)
      .order('numero', { ascending: true });

    if (error) throw error;
    return (data || []).map(q => mapQuestaoFromDB(q));
  }, { ttl: 300 });
}

export async function buscarQuestaoPorId(questaoId: string): Promise<Questao | null> {
  const { data, error } = await supabase
    .from('questoes')
    .select('*')
    .eq('id', questaoId)
    .single();

  if (error) return null;
  return mapQuestaoFromDB(data) as Questao;
}

export async function criarQuestao(provaId: string, questao: Omit<Questao, 'id' | 'numero'>): Promise<Questao> {
  const { data: existentes } = await supabase
    .from('questoes')
    .select('numero')
    .eq('prova_id', provaId)
    .order('numero', { ascending: false })
    .limit(1);

  const proximoNumero = (existentes?.[0]?.numero || 0) + 1;

  const dbQuestao = mapQuestaoToDB({ ...questao, provaId, numero: proximoNumero });

  const { data, error } = await supabase
    .from('questoes')
    .insert(dbQuestao)
    .select()
    .single();

  if (error) throw error;

  invalidate(`questoes:${provaId}`);
  invalidate('prova-ativa');

  return mapQuestaoFromDB(data);
}

export async function atualizarQuestao(
  questaoId: string,
  updates: Partial<Omit<Questao, 'id'>>
): Promise<Questao> {
  const dbUpdates = mapQuestaoToDB(updates);

  const { data, error } = await supabase
    .from('questoes')
    .update(dbUpdates)
    .eq('id', questaoId)
    .select()
    .single();

  if (error) throw error;

  const { data: provaData } = await supabase
    .from('questoes')
    .select('prova_id')
    .eq('id', questaoId)
    .single();

  if (provaData) {
    invalidate(`questoes:${provaData.prova_id}`);
    invalidate('prova-ativa');
  }

  return mapQuestaoFromDB(data);
}

export async function deletarQuestao(questaoId: string): Promise<void> {
  const { data: provaData } = await supabase
    .from('questoes')
    .select('prova_id')
    .eq('id', questaoId)
    .single();

  const { error } = await supabase
    .from('questoes')
    .delete()
    .eq('id', questaoId);

  if (error) throw error;

  if (provaData) {
    invalidate(`questoes:${provaData.prova_id}`);
    invalidate('prova-ativa');
  }
}

// ── Campos do Aluno ─────────────────────────────────────────────────────────────

export async function listarCamposAluno(provaId: string): Promise<CampoAluno[]> {
  const { data, error } = await supabase
    .from('campos_aluno')
    .select('*')
    .eq('prova_id', provaId)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return (data || []).map(c => ({
    id: c.id,
    tipo: c.tipo,
    label: c.label,
    obrigatorio: c.obrigatorio,
    opcoes: c.opcoes,
    ordem: c.ordem,
  }));
}

export async function atualizarCamposAluno(provaId: string, campos: CampoAluno[]): Promise<void> {
  // Remove todos os campos existentes
  await supabase.from('campos_aluno').delete().eq('prova_id', provaId);

  // Insere novos
  const rows = campos.map(c => ({
    prova_id: provaId,
    id: c.id,
    tipo: c.tipo,
    label: c.label,
    obrigatorio: c.obrigatorio,
    opcoes: c.opcoes || null,
    ordem: c.ordem,
  }));

  const { error } = await supabase.from('campos_aluno').insert(rows);
  if (error) throw error;
}

// ── Helpers de mapeamento ───────────────────────────────────────────────────────

function mapQuestaoToDB(q: any): any {
  const base: any = {
    prova_id: q.provaId,
    numero: q.numero,
    tipo: q.tipo,
    enunciado: q.enunciado,
    valor: q.valor,
    dados: {},
  };

  if (q.tipo === 'multipla' || q.tipo === 'multipla-simples') {
    base.dados = { opcoes: q.opcoes };
  } else if (q.tipo === 'vf') {
    base.dados = { afirmativas: q.afirmativas };
  } else if (q.tipo === 'lacuna') {
    base.subtipo = q.subtipo;
    base.texto_com_lacunas = q.textoComLacunas;
    base.dados = { lacunas: q.lacunas };
    if (q.subtipo === 'bloco' && q.blocoPalavras) {
      base.bloco_palavras = q.blocoPalavras;
    }
  }

  return base;
}

function mapQuestaoFromDB(db: any): Questao {
  const base = {
    id: db.id,
    provaId: db.prova_id,
    numero: db.numero,
    tipo: db.tipo,
    enunciado: db.enunciado,
    valor: db.valor,
  };

  if (db.tipo === 'multipla' || db.tipo === 'multipla-simples') {
    return { ...base, opcoes: db.dados?.opcoes || [] } as Questao;
  }

  if (db.tipo === 'vf') {
    return { ...base, afirmativas: db.dados?.afirmativas || [] } as Questao;
  }

  if (db.tipo === 'lacuna') {
    return {
      ...base,
      subtipo: db.subtipo || 'opcoes',
      textoComLacunas: db.texto_com_lacunas || '',
      lacunas: db.dados?.lacunas || [],
      blocoPalavras: db.bloco_palavras,
    } as Questao;
  }

  return base as unknown as Questao;
}

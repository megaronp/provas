import { supabase } from '../db/supabaseClient';
import { Prova, Resultado, Relatorio, MediaQuestao, Submissao, Resposta } from '../models/types';
import { corrigirSubmissao } from '../correction/corrector';
import { getCached } from '../utils/cache';

export async function buscarResultadosDaSheet(prova: Prova): Promise<Resultado[]> {
  return getCached(`resultados:${prova.id}`, async () => {
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
      .eq('prova_id', prova.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar resultados:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((s: any) => {
      const submissao: Submissao = {
        id: s.id,
        provaId: s.prova_id,
        aluno: s.aluno_dados,
        respostas: (s.respostas || []).map((r: any) => r.dados as Resposta),
        dataEnvio: s.created_at,
      };

      const resultadoCalculado = corrigirSubmissao(prova, submissao);

      return {
        submissaoId: s.id,
        provaId: s.prova_id,
        provaTitle: prova.titulo,
        aluno: s.aluno_dados,
        resultadosPorQuestao: resultadoCalculado.resultadosPorQuestao,
        notaTotal: resultadoCalculado.notaTotal,
        notaMaxima: resultadoCalculado.notaMaxima,
        dataEnvio: s.created_at,
      };
    });
  }, { ttl: 60 });
}

export async function calcularRelatorio(prova: Prova): Promise<Relatorio> {
  const { data: submissoes, error: submissoesError } = await supabase
    .from('submissoes')
    .select('id, nota_total, nota_maxima, created_at, respostas (questao_id, nota)')
    .eq('prova_id', prova.id);

  if (submissoesError || !submissoes || submissoes.length === 0) {
    return {
      provaId: prova.id,
      provaTitle: prova.titulo,
      totalAlunos: 0,
      mediaGeral: 0,
      notaMaxima: prova.questoes.reduce((a, q) => a + q.valor, 0),
      mediasPorQuestao: [],
      resultados: []
    };
  }

  const totalAlunos = submissoes.length;
  const notas = submissoes.map(s => s.nota_total || 0);
  const mediaGeral = notas.reduce((a, b) => a + b, 0) / totalAlunos;
  const notaMaxima = prova.questoes.reduce((a, q) => a + q.valor, 0);

  const questoesMap = new Map(prova.questoes.map(q => [q.id, q]));
  const mediasPorQuestao: MediaQuestao[] = [];
  for (const q of prova.questoes) {
    let totalNota = 0;
    let count = 0;
    for (const s of submissoes) {
      const respostas = s.respostas || [];
      const r = respostas.find((r: any) => r.questao_id === q.id);
      if (r?.nota !== undefined && r.nota !== null) {
        totalNota += Number(r.nota);
        count++;
      }
    }
    const mediaObtida = count > 0 ? totalNota / count : 0;
    const percentual = q.valor > 0 ? (mediaObtida / q.valor) * 100 : 0;
    mediasPorQuestao.push({
      questaoId: q.id,
      numero: q.numero,
      enunciado: q.enunciado,
      valorTotal: q.valor,
      mediaObtida: Number(mediaObtida.toFixed(2)),
      percentual: Number(percentual.toFixed(1))
    });
  }

  return {
    provaId: prova.id,
    provaTitle: prova.titulo,
    totalAlunos,
    mediaGeral: Number(mediaGeral.toFixed(2)),
    notaMaxima,
    mediasPorQuestao,
    resultados: []
  };
}

export function gerarCSV(relatorio: Relatorio, prova: Prova): string {
  const camposAluno = prova.camposAluno.length > 0
    ? prova.camposAluno.map(c => c.label)
    : ['Nome', 'Matrícula', 'Data'];

  const headerQuestoes: string[] = [];
  for (const q of prova.questoes) {
    headerQuestoes.push(`Q${q.numero}(resp)`);
    headerQuestoes.push(`Q${q.numero}(total)`);
    headerQuestoes.push(`Q${q.numero}%`);
  }
  const header = [...camposAluno, ...headerQuestoes, 'Total aluno', 'Total prova', 'Media %'];

  const linhas = relatorio.resultados.map(r => {
    const campoVals = camposAluno.map(c => {
      const v = r.aluno[c];
      return Array.isArray(v) ? v.join('; ') : (v || '');
    });
    const questaoVals: (string | number)[] = [];
    for (let i = 0; i < prova.questoes.length; i++) {
      const rq = r.resultadosPorQuestao.find(x => x.questaoId === prova.questoes[i].id);
      const pontos = rq?.pontosObtidos ?? 0;
      const total = rq?.valorTotal ?? 0;
      const pct = total > 0 ? ((pontos / total) * 100).toFixed(2) : '0.00';
      questaoVals.push(pontos);
      questaoVals.push(total);
      questaoVals.push(pct + '%');
    }
    const mediaPct = r.notaMaxima > 0 ? ((r.notaTotal / r.notaMaxima) * 100).toFixed(2) : '0.00';
    return [...campoVals, ...questaoVals, r.notaTotal, r.notaMaxima, mediaPct + '%'];
  });

  const medias: (string | number)[] = [
    ...camposAluno.map((_, i) => i === 0 ? 'MÉDIA' : ''),
  ];
  for (const m of relatorio.mediasPorQuestao) {
    const pct = m.valorTotal > 0 ? ((m.mediaObtida / m.valorTotal) * 100).toFixed(2) : '0.00';
    medias.push(m.mediaObtida);
    medias.push(m.valorTotal);
    medias.push(pct + '%');
  }
  const mediaGeralPct = relatorio.notaMaxima > 0 ? ((relatorio.mediaGeral / relatorio.notaMaxima) * 100).toFixed(2) : '0.00';
  medias.push(relatorio.mediaGeral);
  medias.push(relatorio.notaMaxima);
  medias.push(mediaGeralPct + '%');

  const toCSVLine = (row: (string | number)[]) =>
    row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  return [
    toCSVLine(header),
    ...linhas.map(toCSVLine),
    '',
    toCSVLine(medias),
  ].join('\n');
}
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Prova, Resultado, Relatorio, MediaQuestao } from '../models/types';

function getAuth() {
  const keyPath = path.join(process.cwd(), 'credentials', 'google-key.json');
  if (!fs.existsSync(keyPath)) throw new Error('google-key.json não encontrado');
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function buscarResultadosDaSheet(prova: Prova): Promise<Resultado[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: prova.googleSheetId,
    range: 'A1:ZZ',
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  const dataRows = rows.slice(1);

  // Detecta colunas dinamicamente
  const camposAluno = prova.camposAluno || [];
  const nCamposAluno = camposAluno.length > 0 ? camposAluno.length : 3; // fallback: nome, matrícula, data
  const nQuestoes = prova.questoes.length;

  const resultados: Resultado[] = dataRows.map((row, idx) => {
    const aluno: Record<string, string> = {};
    for (let i = 0; i < nCamposAluno; i++) {
      const label = header[i] || `campo${i}`;
      aluno[label] = row[i] || '';
    }

    const resultadosPorQuestao = prova.questoes.map((q, qi) => ({
      questaoId: q.id,
      numero: q.numero,
      pontosObtidos: parseFloat(row[nCamposAluno + qi] || '0'),
      valorTotal: q.valor,
    }));

    const notaTotal = parseFloat(row[nCamposAluno + nQuestoes] || '0');
    const notaMaxima = parseFloat(row[nCamposAluno + nQuestoes + 1] || '0');

    return {
      submissaoId: `sheet-row-${idx + 2}`,
      provaId: prova.id,
      provaTitle: prova.titulo,
      aluno,
      resultadosPorQuestao,
      notaTotal,
      notaMaxima,
      dataEnvio: '',
    };
  });

  return resultados.filter(r => r.notaMaxima > 0);
}

export function calcularRelatorio(prova: Prova, resultados: Resultado[]): Relatorio {
  const total = resultados.length;
  if (total === 0) {
    return {
      provaId: prova.id,
      provaTitle: prova.titulo,
      totalAlunos: 0,
      mediaGeral: 0,
      notaMaxima: prova.questoes.reduce((a, q) => a + q.valor, 0),
      mediasPorQuestao: [],
      resultados: [],
    };
  }

  const mediaGeral = parseFloat(
    (resultados.reduce((a, r) => a + r.notaTotal, 0) / total).toFixed(2)
  );
  const notaMaxima = prova.questoes.reduce((a, q) => a + q.valor, 0);

  const mediasPorQuestao: MediaQuestao[] = prova.questoes.map(q => {
    const soma = resultados.reduce((a, r) => {
      const rq = r.resultadosPorQuestao.find(x => x.questaoId === q.id);
      return a + (rq?.pontosObtidos || 0);
    }, 0);
    const media = parseFloat((soma / total).toFixed(2));
    return {
      questaoId: q.id,
      numero: q.numero,
      enunciado: q.enunciado,
      valorTotal: q.valor,
      mediaObtida: media,
      percentual: parseFloat(((media / q.valor) * 100).toFixed(1)),
    };
  });

  return {
    provaId: prova.id,
    provaTitle: prova.titulo,
    totalAlunos: total,
    mediaGeral,
    notaMaxima,
    mediasPorQuestao,
    resultados,
  };
}

export function gerarCSV(relatorio: Relatorio, prova: Prova): string {
  const camposAluno = prova.camposAluno.length > 0
    ? prova.camposAluno.map(c => c.label)
    : ['Nome', 'Matrícula', 'Data'];

  const headerQuestoes = prova.questoes.map(q => `Q${q.numero}(${q.valor}pts)`);
  const header = [...camposAluno, ...headerQuestoes, 'Nota Final', 'Nota Máxima'];

  const linhas = relatorio.resultados.map(r => {
    const campoVals = camposAluno.map(c => {
      const v = r.aluno[c];
      return Array.isArray(v) ? v.join('; ') : (v || '');
    });
    const questaoVals = prova.questoes.map(q => {
      const rq = r.resultadosPorQuestao.find(x => x.questaoId === q.id);
      return rq?.pontosObtidos ?? 0;
    });
    return [...campoVals, ...questaoVals, r.notaTotal, r.notaMaxima];
  });

  // Linha de médias
  const medias = [
    ...camposAluno.map((_, i) => i === 0 ? 'MÉDIA' : ''),
    ...relatorio.mediasPorQuestao.map(m => m.mediaObtida),
    relatorio.mediaGeral,
    relatorio.notaMaxima,
  ];

  const toCSVLine = (row: (string | number)[]) =>
    row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  return [
    toCSVLine(header),
    ...linhas.map(toCSVLine),
    '',
    toCSVLine(medias),
  ].join('\n');
}

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Resultado, Prova } from '../models/types';

function getAuth() {
  const keyPath = path.join(process.cwd(), 'credentials', 'google-key.json');
  if (!fs.existsSync(keyPath)) throw new Error('credentials/google-key.json não encontrado.');
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function garantirCabecalho(sheetId: string, prova: Prova): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const camposAluno = prova.camposAluno.length > 0
    ? prova.camposAluno.map(c => c.label)
    : ['Nome', 'Matrícula', 'Data'];

  const cabecalho = [
    ...camposAluno,
    ...prova.questoes.map(q => `Q${q.numero} (${q.valor}pts)`),
    'Nota Final',
    'Nota Máxima',
  ];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A1:A1',
  });

  const valorAtual = res.data.values?.[0]?.[0];
  if (valorAtual === camposAluno[0]) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: { values: [cabecalho] },
  });
}

export async function salvarResultadoNaSheet(
  sheetId: string,
  prova: Prova,
  resultado: Resultado
): Promise<void> {
  await garantirCabecalho(sheetId, prova);

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const camposAluno = prova.camposAluno.length > 0
    ? prova.camposAluno.map(c => c.label)
    : ['Nome', 'Matrícula', 'Data'];

  const valoresCampos = camposAluno.map(label => {
    const v = resultado.aluno[label];
    return Array.isArray(v) ? v.join(', ') : (v || '');
  });

  const pontosPorQuestao = prova.questoes.map(q => {
    const r = resultado.resultadosPorQuestao.find(rq => rq.questaoId === q.id);
    return r ? r.pontosObtidos : 0;
  });

  const linha = [...valoresCampos, ...pontosPorQuestao, resultado.notaTotal, resultado.notaMaxima];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [linha] },
  });
}

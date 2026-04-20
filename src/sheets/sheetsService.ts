import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Resultado, Prova, Submissao, Questao, QuestaoLacuna, RespostaLacuna, RespostaLacunaBloco } from '../models/types';

// TODO: Migrate to Supabase config table
function getGoogleCredentials(): any {
  const keyPath = path.join(process.cwd(), 'credentials', 'google-key.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  }
  throw new Error('Credenciais do Google não configuradas.');
}

function getAuth() {
  const credentials = getGoogleCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function garantirCabecalho(sheetId: string, prova: Prova): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const camposAluno = prova.camposAluno.length > 0
    ? prova.camposAluno.map(c => c.label)
    : ['Nome', 'Matrícula', 'Data'];

  const cabecalho: string[] = [...camposAluno];
  for (const q of prova.questoes) {
    cabecalho.push(`Q${q.numero} (resp)`);
    cabecalho.push(`Q${q.numero} (${q.valor}pts)`);
  }
  cabecalho.push('Nota Final');
  cabecalho.push('Nota Máxima');

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

function formatarRespostaQuestao(questao: Questao, resposta: any): string {
  if (!resposta) return '';
  
  if (questao.tipo === 'lacuna') {
    const lacunaQ = questao as QuestaoLacuna;
    if (resposta.tipo === 'lacuna' || resposta.tipo === 'lacuna-bloco') {
      const respostas = [];
      for (const lac of lacunaQ.lacunas) {
        const valor = resposta.respostas?.[lac.id];
        if (valor) respostas.push(valor);
      }
      return respostas.join('; ');
    }
    return '';
  }
  
  if (questao.tipo === 'multipla') {
    const opts = resposta.opcoesSelecionadas || [];
    const textoOpts = (questao as any).opcoes
      .filter((o: any) => opts.includes(o.id))
      .map((o: any) => o.texto)
      .join('; ');
    return textoOpts;
  }
  
  if (questao.tipo === 'multipla-simples') {
    const optId = resposta.opcaoSelecionada;
    const opt = (questao as any).opcoes.find((o: any) => o.id === optId);
    return opt?.texto || '';
  }
  
  if (questao.tipo === 'vf') {
    const resp = resposta.respostas || {};
    const afirmativas = (questao as any).afirmativas
      .map((a: any) => `${a.texto.substring(0, 30)}: ${resp[a.id] === true ? 'V' : resp[a.id] === false ? 'F' : '-'}`)
      .join(' | ');
    return afirmativas;
  }
  
  return '';
}

export async function salvarResultadoNaSheet(
  sheetId: string,
  prova: Prova,
  resultado: Resultado,
  submissao?: Submissao
): Promise<void> {
  // Se não houver ID de planilha, pula o backup (opcional)
  if (!sheetId) {
    console.log('Google Sheets não configurado - backup pulado');
    return;
  }

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

  const linha: (string | number)[] = [...valoresCampos];
  for (const q of prova.questoes) {
    const r = resultado.resultadosPorQuestao.find(rq => rq.questaoId === q.id);
    let respostaTexto = '';
    if (r && submissao) {
      const respAluno = submissao.respostas.find(resp => resp.questaoId === q.id);
      if (respAluno) {
        respostaTexto = formatarRespostaQuestao(q, respAluno);
      }
    }
    linha.push(respostaTexto);
    linha.push(r ? r.pontosObtidos : 0);
  }
  linha.push(resultado.notaTotal);
  linha.push(resultado.notaMaxima);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [linha] },
  });
}

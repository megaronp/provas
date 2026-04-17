import {
  Prova, Submissao, Resultado, ResultadoQuestao,
  QuestaoMultipla, QuestaoVF, QuestaoLacuna,
  RespostaMultipla, RespostaVF, RespostaLacuna
} from '../models/types';

/**
 * Múltipla escolha — sistema de pontos por acerto e por evitar erros:
 *
 * Cada opção vale 1 "unidade":
 *   +1 unidade para cada opção CORRETA que o aluno MARCOU
 *   +1 unidade para cada opção ERRADA que o aluno NÃO MARCOU
 *
 * Total de unidades possíveis = nº de corretas + nº de erradas = total de opções
 * Pontuação = (unidades_obtidas / total_unidades) * valor_da_questão
 *
 * Exemplo: 5 opções (2 certas, 3 erradas), questão = 5 pts
 *   Marcou 1 certa, 0 erradas  → 1 + 3 = 4 unidades → 4 pts
 *   Marcou 2 certas, 0 erradas → 2 + 3 = 5 unidades → 5 pts (100%)
 *   Marcou 1 certa, 1 errada   → 1 + 2 = 3 unidades → 3 pts
 *   Marcou 0, 0                → 0 + 3 = 3 unidades → 3 pts
 *   Marcou tudo (2c + 3e)      → 2 + 0 = 2 unidades → 2 pts
 */
function corrigirMultipla(questao: QuestaoMultipla, resposta: RespostaMultipla): number {
  const corretas = questao.opcoes.filter(o => o.correta).map(o => o.id);
  const erradas  = questao.opcoes.filter(o => !o.correta).map(o => o.id);
  const selecionadas = resposta.opcoesSelecionadas || [];

  const totalOpcoes = questao.opcoes.length;
  if (totalOpcoes === 0) return 0;

  // Unidades ganhas
  const corretasMarcadas  = selecionadas.filter(s => corretas.includes(s)).length;
  const erradasNaoMarcadas = erradas.filter(e => !selecionadas.includes(e)).length;
  const unidadesObtidas = corretasMarcadas + erradasNaoMarcadas;

  return parseFloat(((unidadesObtidas / totalOpcoes) * questao.valor).toFixed(2));
}

/**
 * Verdadeiro/Falso proporcional com desconto:
 * - Cada afirmativa vale valor/total pontos
 * - Acerto: +ponto, Erro: -ponto (mínimo 0)
 */
function corrigirVF(questao: QuestaoVF, resposta: RespostaVF): number {
  const total = questao.afirmativas.length;
  if (total === 0) return 0;
  const valorPorItem = questao.valor / total;
  let pontos = 0;

  for (const af of questao.afirmativas) {
    const respostaAluno = resposta.respostas[af.id];
    if (respostaAluno === undefined) continue; // não respondida: não ganha nem perde
    if (respostaAluno === af.correta) {
      pontos += valorPorItem;
    } else {
      pontos -= valorPorItem;
    }
  }

  return parseFloat(Math.max(0, pontos).toFixed(2));
}

function corrigirLacuna(questao: QuestaoLacuna, resposta: RespostaLacuna): number {
  const total = questao.lacunas.length;
  if (total === 0) return 0;
  let acertos = 0;
  for (const lacuna of questao.lacunas) {
    const respostaAluno = resposta.respostas[lacuna.id];
    if (respostaAluno && respostaAluno.trim().toLowerCase() === lacuna.correta.trim().toLowerCase()) {
      acertos++;
    }
  }
  return parseFloat(((acertos / total) * questao.valor).toFixed(2));
}

export function corrigirSubmissao(prova: Prova, submissao: Submissao): Resultado {
  const resultadosPorQuestao: ResultadoQuestao[] = [];

  for (const questao of prova.questoes) {
    const resposta = submissao.respostas.find(r => r.questaoId === questao.id);
    let pontosObtidos = 0;

    if (resposta) {
      if (questao.tipo === 'multipla' && resposta.tipo === 'multipla') {
        pontosObtidos = corrigirMultipla(questao, resposta);
      } else if (questao.tipo === 'vf' && resposta.tipo === 'vf') {
        pontosObtidos = corrigirVF(questao, resposta);
      } else if (questao.tipo === 'lacuna' && resposta.tipo === 'lacuna') {
        pontosObtidos = corrigirLacuna(questao, resposta);
      }
    }

    resultadosPorQuestao.push({
      questaoId: questao.id,
      numero: questao.numero,
      pontosObtidos,
      valorTotal: questao.valor
    });
  }

  const notaTotal = parseFloat(
    resultadosPorQuestao.reduce((acc, r) => acc + r.pontosObtidos, 0).toFixed(2)
  );
  const notaMaxima = parseFloat(
    prova.questoes.reduce((acc, q) => acc + q.valor, 0).toFixed(2)
  );

  return {
    submissaoId: submissao.id,
    provaId: prova.id,
    provaTitle: prova.titulo,
    aluno: submissao.aluno,
    resultadosPorQuestao,
    notaTotal,
    notaMaxima,
    dataEnvio: submissao.dataEnvio
  };
}

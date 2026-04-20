import {
  Prova, Submissao, Resultado, ResultadoQuestao,
  QuestaoMultipla, QuestaoMultiplaSimples, QuestaoVF, QuestaoLacuna,
  RespostaMultipla, RespostaMultiplaSimples, RespostaVF, RespostaLacuna, RespostaLacunaBloco
} from '../models/types';

/**
 * Múltipla escolha — sistema sem penalização:
 *
 * Cada opção vale: valor_da_questão / número_de_opções
 *
 * Pontuação por opção:
 *   +1 ponto para cada opção CORRETA MARCADA
 *   +1 ponto para cada opção ERRADA NÃO MARCADA
 *   0 ponto para opção ERRADA MARCADA ou CORRETA NÃO MARCADA
 *
 * Nota: pts_mínimo = 0
 *
 * Exemplo: 4 opções (A,B,C,D), B,C corretas, valor=4, cada opção=1pt
 *   Marcou só B:  +1(B) +2(A,D não marcadas) = 3pt
 *   Marcou A,B:   +1(B) +1(D não marcada) = 2pt
 *   Marcou A,B,C: +2(B,C) +1(D não marcada) = 3pt
 *   Marcou todas: +2(B,C) +0 = 2pt
 *   Não marcou:   +0 +2(A,D não marcadas) = 2pt
 */
function corrigirMultipla(questao: QuestaoMultipla, resposta: RespostaMultipla): number {
  const corretas = questao.opcoes.filter(o => o.correta).map(o => o.id);
  const erradas  = questao.opcoes.filter(o => !o.correta).map(o => o.id);
  const selecionadas = resposta.opcoesSelecionadas || [];

  const totalOpcoes = questao.opcoes.length;
  if (totalOpcoes === 0) return 0;

  const valorPorOpcao = questao.valor / totalOpcoes;

  const corretasMarcadas    = corretas.filter(c => selecionadas.includes(c)).length;
  const erradasNaoMarcadas = erradas.filter(e => !selecionadas.includes(e)).length;

  const pontos = (corretasMarcadas * valorPorOpcao)
               + (erradasNaoMarcadas * valorPorOpcao);

  return parseFloat(Math.max(0, pontos).toFixed(2));
}

function corrigirMultiplaSimples(questao: QuestaoMultiplaSimples, resposta: RespostaMultiplaSimples): number {
  if (!resposta.opcaoSelecionada) return 0;
  const opcaoCorreta = questao.opcoes.find(o => o.correta);
  return resposta.opcaoSelecionada === opcaoCorreta?.id ? questao.valor : 0;
}

/**
 * Verdadeiro/Falso - ponto por acerto:
 * - Cada afirmativa vale valor/total pontos
 * - +1 ponto para cada afirmativa respondida CORRETAMENTE
 * - 0 ponto para cada afirmativa respondida ERRADAMENTE
 * - Mínimo: 0
 */
function corrigirVF(questao: QuestaoVF, resposta: RespostaVF): number {
  const total = questao.afirmativas.length;
  if (total === 0) return 0;
  const valorPorItem = questao.valor / total;
  let pontos = 0;

  for (const af of questao.afirmativas) {
    const respostaAluno = resposta.respostas[af.id];
    if (respostaAluno === undefined) continue;
    
    if (respostaAluno === af.correta) {
      pontos += valorPorItem;
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

function corrigirLacunaBloco(questao: QuestaoLacuna, resposta: RespostaLacunaBloco): number {
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

    if (resposta && resposta.tipo === 'nao-respondida') {
      pontosObtidos = 0;
    } else if (resposta) {
      if (questao.tipo === 'multipla' && resposta.tipo === 'multipla') {
        pontosObtidos = corrigirMultipla(questao, resposta);
      } else if (questao.tipo === 'multipla-simples' && resposta.tipo === 'multipla-simples') {
        pontosObtidos = corrigirMultiplaSimples(questao, resposta);
      } else if (questao.tipo === 'vf' && resposta.tipo === 'vf') {
        pontosObtidos = corrigirVF(questao, resposta);
      } else if (questao.tipo === 'lacuna' && resposta.tipo === 'lacuna') {
        pontosObtidos = corrigirLacuna(questao, resposta);
      } else if (questao.tipo === 'lacuna' && resposta.tipo === 'lacuna-bloco') {
        pontosObtidos = corrigirLacunaBloco(questao, resposta);
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

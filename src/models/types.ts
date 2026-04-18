// ─── Tipos de Questão ────────────────────────────────────────────────────────

export type TipoQuestao = 'multipla' | 'multipla-simples' | 'vf' | 'lacuna';
export type SubtipoLacuna = 'opcoes' | 'bloco';

export interface OpcaoMultipla {
  id: string;
  texto: string;
  correta: boolean;
}

export interface AfirmativaVF {
  id: string;
  texto: string;
  correta: boolean;
}

export interface Lacuna {
  id: string;
  posicao: number;
  opcoes: string[];
  correta: string;
}

export interface QuestaoBase {
  id: string;
  numero: number;
  tipo: TipoQuestao;
  enunciado: string;
  valor: number;
}

export interface QuestaoMultipla extends QuestaoBase {
  tipo: 'multipla';
  opcoes: OpcaoMultipla[];
}

export interface QuestaoMultiplaSimples extends QuestaoBase {
  tipo: 'multipla-simples';
  opcoes: OpcaoMultipla[];
}

export interface QuestaoVF extends QuestaoBase {
  tipo: 'vf';
  afirmativas: AfirmativaVF[];
}

export interface QuestaoLacuna extends QuestaoBase {
  tipo: 'lacuna';
  subtipo: SubtipoLacuna;
  textoComLacunas: string;
  lacunas: Lacuna[];
  blocoPalavras?: string[];
}

export type Questao = QuestaoMultipla | QuestaoMultiplaSimples | QuestaoVF | QuestaoLacuna;

// ─── Campos Dinâmicos do Aluno ────────────────────────────────────────────────

export type TipoCampoAluno = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';

export interface OpcaoCampo {
  label: string;
  value: string;
}

export interface CampoAluno {
  id: string;
  tipo: TipoCampoAluno;
  label: string;
  obrigatorio: boolean;
  opcoes?: OpcaoCampo[];
  ordem: number;
}

// ─── Prova ───────────────────────────────────────────────────────────────────

export interface Prova {
  id: string;
  titulo: string;
  disciplina: string;
  dataCriacao: string;
  googleSheetId: string;
  questoes: Questao[];
  camposAluno: CampoAluno[];
  ativa: boolean;
}

// ─── Respostas do Aluno ───────────────────────────────────────────────────────

export interface RespostaMultipla {
  tipo: 'multipla';
  questaoId: string;
  opcoesSelecionadas: string[];
}

export interface RespostaMultiplaSimples {
  tipo: 'multipla-simples';
  questaoId: string;
  opcaoSelecionada: string;
}

export interface RespostaVF {
  tipo: 'vf';
  questaoId: string;
  respostas: Record<string, boolean>;
}

export interface RespostaLacuna {
  tipo: 'lacuna';
  questaoId: string;
  respostas: Record<string, string>;
}

export interface RespostaLacunaBloco {
  tipo: 'lacuna-bloco';
  questaoId: string;
  respostas: Record<string, string>;
  palavrasUsadas: string[];
}

export type Resposta = RespostaMultipla | RespostaMultiplaSimples | RespostaVF | RespostaLacuna | RespostaLacunaBloco;

export type DadosAluno = Record<string, string | string[]>;

export interface Submissao {
  id: string;
  provaId: string;
  aluno: DadosAluno;
  respostas: Resposta[];
  dataEnvio: string;
}

// ─── Resultado ───────────────────────────────────────────────────────────────

export interface ResultadoQuestao {
  questaoId: string;
  numero: number;
  pontosObtidos: number;
  valorTotal: number;
}

export interface Resultado {
  submissaoId: string;
  provaId: string;
  provaTitle: string;
  aluno: DadosAluno;
  resultadosPorQuestao: ResultadoQuestao[];
  notaTotal: number;
  notaMaxima: number;
  dataEnvio: string;
}

// ─── Relatório ───────────────────────────────────────────────────────────────

export interface MediaQuestao {
  questaoId: string;
  numero: number;
  enunciado: string;
  valorTotal: number;
  mediaObtida: number;
  percentual: number;
}

export interface Relatorio {
  provaId: string;
  provaTitle: string;
  totalAlunos: number;
  mediaGeral: number;
  notaMaxima: number;
  mediasPorQuestao: MediaQuestao[];
  resultados: Resultado[];
}

-- supabase/migrations/20260419_120000_adr_013_materialized_views.sql
-- ADR-013: Materialized Views for Reports
-- Cria views materializadas para agregação de estatísticas de relatórios,
-- evitando cálculo O(N) a cada request.

-- Up: Aplicar mudanças
BEGIN;

-- 1. Adicionar coluna `nota` na tabela `respostas` para armazenar a pontuação obtida por resposta
ALTER TABLE respostas ADD COLUMN IF NOT EXISTS nota NUMERIC(5,2);

-- 2. Atualizar função `salvar_submissao_completa` para incluir a nota no insert das respostas
CREATE OR REPLACE FUNCTION salvar_submissao_completa(
  p_id UUID,
  p_prova_id UUID, 
  p_aluno_dados JSONB,
  p_respostas JSONB[]
) RETURNS submissoes AS $$
DECLARE
  v_submissao submissoes;
BEGIN
  -- Insert submissão
  INSERT INTO submissoes (id, prova_id, aluno_dados, nota_total, nota_maxima)
  VALUES (p_id, p_prova_id, p_aluno_dados, 0, 0)
  RETURNING * INTO v_submissao;

  -- Insert respostas em batch, incluindo a nota (se fornecida)
  INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados, nota)
  SELECT 
    uuid_generate_v4(),
    v_submissao.id,
    r->>'questao_id',
    r->>'tipo',
    r->'dados',
    (r->>'nota')::numeric
  FROM unnest(p_respostas) AS r;

  RETURN v_submissao;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar materialized view para estatísticas por prova
CREATE MATERIALIZED VIEW IF NOT EXISTS relatorio_prova_cache AS
SELECT 
  s.prova_id,
  COUNT(*) as total_alunos,
  ROUND(AVG(s.nota_total::numeric), 2) as media_geral,
  MAX(s.nota_maxima) as nota_maxima,
  MAX(s.created_at) as ultima_submissao
FROM submissoes s
GROUP BY s.prova_id;

-- Índice único para lookup rápido por prova
CREATE UNIQUE INDEX IF NOT EXISTS idx_relatorio_prova_cache_prova_id ON relatorio_prova_cache(prova_id);

-- 4. Criar materialized view para estatísticas por questão
CREATE MATERIALIZED VIEW IF NOT EXISTS relatorio_questao_cache AS
SELECT 
  r.questao_id,
  s.prova_id,
  q.numero,
  q.enunciado,
  COUNT(r.id) as total_respostas,
  ROUND(AVG(COALESCE(r.nota, 0)::numeric), 2) as media_obtida,
  q.valor as valor_total,
  ROUND(AVG(COALESCE(r.nota, 0)::numeric) / q.valor * 100, 1) as percentual
FROM respostas r
JOIN submissoes s ON r.submissao_id = s.id
JOIN questoes q ON r.questao_id = q.id
GROUP BY r.questao_id, s.prova_id, q.numero, q.enunciado, q.valor;

-- Índice para buscar questões por prova
CREATE INDEX IF NOT EXISTS idx_relatorio_questao_cache_prova ON relatorio_questao_cache(prova_id);

COMMIT;

-- Down: Reverter mudanças
BEGIN;

-- Remover índices e views
DROP INDEX IF EXISTS idx_relatorio_questao_cache_prova;
DROP INDEX IF EXISTS idx_relatorio_prova_cache_prova_id;
DROP MATERIALIZED VIEW IF EXISTS relatorio_questao_cache;
DROP MATERIALIZED VIEW IF EXISTS relatorio_prova_cache;

-- Restaurar função original (sem coluna nota)
CREATE OR REPLACE FUNCTION salvar_submissao_completa(
  p_id UUID,
  p_prova_id UUID, 
  p_aluno_dados JSONB,
  p_respostas JSONB[]
) RETURNS submissoes AS $$
DECLARE
  v_submissao submissoes;
BEGIN
  INSERT INTO submissoes (id, prova_id, aluno_dados, nota_total, nota_maxima)
  VALUES (p_id, p_prova_id, p_aluno_dados, 0, 0)
  RETURNING * INTO v_submissao;

  INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados)
  SELECT uuid_generate_v4(), v_submissao.id, r->>'questao_id', r->>'tipo', r->'dados'
  FROM unnest(p_respostas) AS r;

  RETURN v_submissao;
END;
$$ LANGUAGE plpgsql;

-- Nota: a coluna `nota` adicionada não é removida no down para preservar dados
-- Caso seja necessário removê-la, executar manualmente: ALTER TABLE respostas DROP COLUMN nota;

COMMIT;

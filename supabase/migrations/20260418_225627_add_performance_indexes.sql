-- supabase/migrations/20260418_225627_add_performance_indexes.sql

-- Up (apply)
BEGIN;

-- Indexes on all FKs for performance
CREATE INDEX IF NOT EXISTS idx_questoes_prova_id ON questoes(prova_id);
CREATE INDEX IF NOT EXISTS idx_campos_aluno_prova_id ON campos_aluno(prova_id);
CREATE INDEX IF NOT EXISTS idx_submissoes_prova_id ON submissoes(prova_id);
CREATE INDEX IF NOT EXISTS idx_respostas_submissao_id ON respostas(submissao_id);
CREATE INDEX IF NOT EXISTS idx_respostas_questao_id ON respostas(questao_id);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_provas_ativa_periodo ON provas(ativa, data_inicio, data_fim) WHERE ativa = true;
CREATE INDEX IF NOT EXISTS idx_submissoes_prova_created ON submissoes(prova_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provas_created_at ON provas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questoes_prova_ordem ON questoes(prova_id, numero ASC);

-- Unique constraint for active prova (ADR-006)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_prova_ativa ON provas(ativa) WHERE ativa = true;

COMMIT;

-- Down (revert)
BEGIN;

DROP INDEX IF EXISTS idx_questoes_prova_id;
DROP INDEX IF EXISTS idx_campos_aluno_prova_id;
DROP INDEX IF EXISTS idx_submissoes_prova_id;
DROP INDEX IF EXISTS idx_respostas_submissao_id;
DROP INDEX IF EXISTS idx_respostas_questao_id;
DROP INDEX IF EXISTS idx_provas_ativa_periodo;
DROP INDEX IF EXISTS idx_submissoes_prova_created;
DROP INDEX IF EXISTS idx_provas_created_at;
DROP INDEX IF EXISTS idx_questoes_prova_ordem;
DROP INDEX IF EXISTS idx_unique_prova_ativa;

COMMIT;
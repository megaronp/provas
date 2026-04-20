-- supabase/migrations/20260419_160000_refresh_relatorio_views.sql
-- Função para fazer refresh das materialized views de relatório

BEGIN;

CREATE OR REPLACE FUNCTION refresh_relatorio_views() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW relatorio_prova_cache;
  REFRESH MATERIALIZED VIEW relatorio_questao_cache;
END;
$$ LANGUAGE plpgsql;

COMMIT;
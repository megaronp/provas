-- supabase/migrations/20260419_153500_fix_type_casting_in_salvar_submissao.sql
-- Corrige cast de questao_id e tipo para tipos corretos da tabela respostas

BEGIN;

-- Recria função com cast explícito para UUID e TEXT
DROP FUNCTION IF EXISTS public.salvar_submissao_completa(UUID, UUID, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.salvar_submissao_completa(
  p_id UUID,
  p_prova_id UUID,
  p_aluno_dados JSONB,
  p_respostas JSONB
) RETURNS submissoes AS $$
DECLARE
  v_submissao submissoes;
BEGIN
  -- Insert submissão
  INSERT INTO submissoes (id, prova_id, aluno_dados, nota_total, nota_maxima)
  VALUES (p_id, p_prova_id, p_aluno_dados, 0, 0)
  RETURNING * INTO v_submissao;

  -- Insert respostas em batch com cast correto
  INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados, nota)
  SELECT
    gen_random_uuid(),
    v_submissao.id,
    (r->>'questao_id')::UUID,        -- Cast explicit to UUID
    r->>'tipo'::TEXT,                -- Cast explicit to TEXT
    r->'dados',
    CASE 
      WHEN r->>'nota' IS NULL OR r->>'nota' = '' THEN NULL
      ELSE (r->>'nota')::NUMERIC(5,2)
    END
  FROM jsonb_array_elements(p_respostas) AS r;

  RETURN v_submissao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION public.salvar_submissao_completa TO anon, authenticated;

COMMIT;

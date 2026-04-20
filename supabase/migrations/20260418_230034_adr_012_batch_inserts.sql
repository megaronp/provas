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

  -- Insert respostas em batch
  INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados)
  SELECT uuid_generate_v4(), v_submissao.id, r->>'questao_id', r->>'tipo', r->'dados'
  FROM unnest(p_respostas) AS r;

  -- TODO: Calcular notas (por enquanto placeholder)
  
  RETURN v_submissao;
END;
$$ LANGUAGE plpgsql;
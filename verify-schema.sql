-- Verifica se tabelas existem e suas colunas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('submissoes', 'respostas')
ORDER BY table_name, ordinal_position;

-- Verifica se a função existe
SELECT proname, proargnames, proargtypes::regtype[]
FROM pg_proc 
WHERE proname = 'salvar_submissao_completa';

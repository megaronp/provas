-- Check if function exists and its schema
SELECT routine_schema, routine_name, data_type, type_udt_name
FROM information_schema.routines 
WHERE routine_name = 'salvar_submissao_completa';

-- Check pg_proc for more details
SELECT proname, pronamespace::regnamespace, proargnames, proargtypes::regtype[]
FROM pg_proc 
WHERE proname = 'salvar_submissao_completa';

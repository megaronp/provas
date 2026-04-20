const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkFunction() {
  // Check if function exists
  const { data: funcs, error: funcError } = await supabase.rpc('salvar_submissao_completa', {
    p_id: '00000000-0000-0000-0000-000000000000',
    p_prova_id: '00000000-0000-0000-0000-000000000000',
    p_aluno_dados: { nome: 'Test' },
    p_respostas: []
  });
  
  console.log('RPC call result:', funcs, funcError);
  
  // Also check via direct query
  const { data: routines, error: routineError } = await supabase
    .rpc('pg_catalog.pg_get_functiondef', { oid: 12345 });
  
  console.log('Function definition check:', routines, routineError);
}

checkFunction().catch(console.error);

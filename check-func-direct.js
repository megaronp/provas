const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkFunctionDirectly() {
  // Query to check function definition directly
  const { data: funcData, error: funcError } = await supabase
    .rpc('pg_catalog.pg_get_functiondef', { 
      oid: (await supabase.from('pg_proc').select('oid').eq('proname', 'salvar_submissao_completa').single()).oid
    });

  console.log('Function exists?', !!funcData);
  console.log('Error:', funcError);
  
  if (funcData) {
    console.log('Function definition:', funcData);
  }
}

checkFunctionDirectly().catch(console.error);

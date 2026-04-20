const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkSchema() {
  // Check if respostas table exists and its columns
  const { data: columns, error: colErr } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'respostas')
    .eq('table_schema', 'public');
  
  console.log('Columns in respostas:', columns);
  console.log('Error:', colErr);
  
  // Check if submissoes table exists
  const { data: subColumns, error: subErr } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'submissoes')
    .eq('table_schema', 'public');
  
  console.log('Columns in submissoes:', subColumns);
  console.log('SubError:', subErr);
}

checkSchema().catch(console.error);

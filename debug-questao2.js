const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function inspectQuestion() {
  // Get a question that might be problematic
  const { data, error } = await supabase
    .from('questoes')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('All questions (raw DB records):');
  data.forEach(q => {
    console.log('---');
    console.log('ID:', q.id);
    console.log('Tipo:', q.tipo);
    console.log('Dados column:', JSON.stringify(q.dados, null, 2));
    console.log('Has opcoes in dados?', q.dados && q.dados.opcoes);
    console.log('opcoes length:', q.dados && q.dados.opcoes ? q.dados.opcoes.length : 0);
  });
}

inspectQuestion().catch(console.error);

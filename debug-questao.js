const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('questoes')
    .select('id, tipo, enunciado, dados')
    .eq('tipo', 'multipla')
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample multipla questions:');
    console.log(JSON.stringify(data, null, 2));
  }
}

check().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testRPC() {
  try {
    const { data, error } = await supabase.rpc('salvar_submissao_completa', {
      p_id: '11111111-1111-1111-1111-111111111111',
      p_prova_id: '22222222-2222-2222-2222-222222222222',
      p_aluno_dados: { nome: 'Teste', email: 'test@test.com' },
      p_respostas: [
        { questao_id: '33333333-3333-3333-3333-333333333333', tipo: 'multipla', dados: { opcoes: [] }, nota: 1 }
      ]
    });
    console.log('Data:', data);
    console.log('Error:', error);
  } catch (err) {
    console.log('Catch error:', err.message);
  }
}

testRPC();

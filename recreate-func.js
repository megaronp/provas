const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function recreateFunction() {
  // Check current function signature
  const { data: proc, error: procErr } = await supabase
    .from('pg_proc')
    .select('oid, proargnames, proargtypes::regtype[]')
    .eq('proname', 'salvar_submissao_completa')
    .single();
  
  console.log('Current proc:', proc);
  console.log('Error:', procErr);
  
  // Drop and recreate with correct signature
  const sql = `
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
      INSERT INTO submissoes (id, prova_id, aluno_dados, nota_total, nota_maxima)
      VALUES (p_id, p_prova_id, p_aluno_dados, 0, 0)
      RETURNING * INTO v_submissao;

      INSERT INTO respostas (id, submissao_id, questao_id, tipo, dados, nota)
      SELECT
        gen_random_uuid(),
        v_submissao.id,
        r->>'questao_id',
        r->>'tipo',
        r->'dados',
        (r->>'nota')::NUMERIC
      FROM jsonb_array_elements(p_respostas) AS r;

      RETURN v_submissao;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    GRANT EXECUTE ON FUNCTION public.salvar_submissao_completa TO anon, authenticated;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.log('RPC exec_sql error, trying direct query...');
    // Try using query method directly
    const { error: directError } = await supabase.from('_rpc').insert({
      method: 'POST',
      path: '/rest/v1/rpc/exec_sql',
      headers: {},
      body: { sql }
    });
    console.log('Direct error:', directError);
  } else {
    console.log('Function recreated successfully');
  }
}

recreateFunction().catch(console.error);

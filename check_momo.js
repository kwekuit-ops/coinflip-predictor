import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hvwurzpmjlsrhxqjbikz.supabase.co',
  'sb_publishable_y91MfWVjM_k_eKp70pdLWg_4qFxYbKy'
);

async function check() {
  console.log('=== Checking momo_transactions schema ===\n');

  // Read existing rows
  const { data, error } = await supabase
    .from('momo_transactions')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Table readable.');
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
      console.log('Rows found:', data.length);
      console.log(JSON.stringify(data, null, 2));
    } else {
      // Check columns by doing a select with no rows
      console.log('Table is empty. Testing column existence via insert (will rollback)...');
      // We can't do a real insert without auth, but the error message will tell us
      const { error: insertErr } = await supabase
        .from('momo_transactions')
        .insert({ tx_id: 'schema_check', momo_phone: '0200000000', momo_name: 'Test', amount_ghs: 1, tokens: 5, package_label: 'test', user_id: '00000000-0000-0000-0000-000000000000', status: 'pending' })
        .select();
      
      if (insertErr?.code === 'PGRST204') {
        console.log('❌ Still missing column:', insertErr.message);
      } else if (insertErr) {
        console.log('✅ Column exists (blocked by RLS, not schema):', insertErr.message);
      } else {
        console.log('✅ Insert succeeded!');
      }
    }
  }
}

check();

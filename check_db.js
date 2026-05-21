import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hvwurzpmjlsrhxqjbikz.supabase.co',
  'sb_publishable_y91MfWVjM_k_eKp70pdLWg_4qFxYbKy'
);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

check();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hvwurzpmjlsrhxqjbikz.supabase.co',
  'sb_publishable_y91MfWVjM_k_eKp70pdLWg_4qFxYbKy'
);

async function check() {
  // Let's sign up a dummy user to test
  const email = `test_${Date.now()}@coinflip.app`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (authErr) {
    console.log('Signup error:', authErr);
    return;
  }
  
  const user = authData.user;
  console.log('User created:', user.id);
  
  // Try to sync credits like App.jsx does
  const { data, error } = await supabase
    .from('profiles')
    .select('credits, is_admin, email')
    .eq('id', user.id)
    .single();
    
  console.log('Select result:', { data, error });
}

check();

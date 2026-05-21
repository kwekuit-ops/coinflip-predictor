import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hvwurzpmjlsrhxqjbikz.supabase.co',
  'sb_publishable_y91MfWVjM_k_eKp70pdLWg_4qFxYbKy'
);

async function testPermissions() {
  console.log('Testing Supabase permissions...');
  
  // Create a random fake email for testing
  const email = `test_${Date.now()}@coinflip.app`;
  
  // 1. Sign up
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (authErr) {
    console.log('❌ Auth Error:', authErr.message);
    return;
  }
  
  console.log('✅ Sign up successful. User ID:', authData.user.id);
  
  // 2. Try to select profile
  const { data: selectData, error: selectErr } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', authData.user.id)
    .single();
    
  if (selectErr) {
    if (selectErr.code === 'PGRST116') {
      console.log('✅ Select returned PGRST116 (No rows found) - This is expected for new users!');
      
      // 3. Try to insert profile
      const { data: insertData, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: authData.user.id, credits: 0, email: authData.user.email })
        .select()
        .single();
        
      if (insertErr) {
         console.log('❌ Insert Error:', insertErr.message);
      } else {
         console.log('✅ Insert successful!', insertData);
      }
    } else {
      console.log('❌ Select Error:', selectErr.message);
    }
  } else {
    console.log('✅ Select successful!', selectData);
  }
}

testPermissions();

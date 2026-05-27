import https from 'https';

const SUPABASE_URL = 'https://hvwurzpmjlsrhxqjbikz.supabase.co';
const ANON_KEY = 'sb_publishable_y91MfWVjM_k_eKp70pdLWg_4qFxYbKy';

// Test both old and new auth endpoints
async function testEndpoint(path, label) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: 'test@test.com', password: 'test123' });
    const url = `${SUPABASE_URL}${path}`;
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log(`[${label}] Status: ${res.statusCode} | ${data.slice(0, 150)}`);
        resolve();
      });
    });
    req.on('error', e => { console.log(`[${label}] Error: ${e.message}`); resolve(); });
    req.write(body);
    req.end();
  });
}

// Also test if signUp works (what the app actually calls)
async function testSignUp() {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: 'testuser999@coinflip.app', password: 'testpass999' });
    const url = `${SUPABASE_URL}/auth/v1/signup`;
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log(`[SIGNUP] Status: ${res.statusCode} | ${data.slice(0, 300)}`);
        resolve();
      });
    });
    req.on('error', e => { console.log(`[SIGNUP] Error: ${e.message}`); resolve(); });
    req.write(body);
    req.end();
  });
}

await testEndpoint('/auth/v1/token?grant_type=password', 'SIGN-IN');
await testSignUp();

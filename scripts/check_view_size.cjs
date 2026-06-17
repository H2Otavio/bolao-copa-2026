const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('vw_user_rankings').select('*');
  if (error) { console.error(error); return; }
  const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
  console.log('Size of vw_user_rankings payload: ' + (size/1024).toFixed(2) + ' KB');
  
  const { data: pData } = await supabase.from('predictions').select('*');
  const pSize = Buffer.byteLength(JSON.stringify(pData), 'utf8');
  console.log('Size of all predictions: ' + (pSize/1024).toFixed(2) + ' KB');
  
  const { data: cData } = await supabase.from('app_cache').select('*');
  const cSize = Buffer.byteLength(JSON.stringify(cData), 'utf8');
  console.log('Size of all app_cache: ' + (cSize/1024).toFixed(2) + ' KB');
}
check();

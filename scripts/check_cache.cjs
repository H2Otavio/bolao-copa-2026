const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('app_cache').select('key, value');
  if (error) { console.error(error); return; }
  let totalBytes = 0;
  data.forEach(row => {
    const size = Buffer.byteLength(JSON.stringify(row.value), 'utf8');
    console.log(row.key + ': ' + (size/1024).toFixed(2) + ' KB');
    totalBytes += size;
  });
  console.log('Total app_cache size: ' + (totalBytes/1024).toFixed(2) + ' KB');
}
check();

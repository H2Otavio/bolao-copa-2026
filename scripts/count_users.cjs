const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: predCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
  console.log('Total users: ' + userCount);
  console.log('Total predictions: ' + predCount);
}
check();

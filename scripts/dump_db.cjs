const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function dump() {
  console.log('Iniciando o dump do banco de dados antigo...');
  
  const tables = ['leagues', 'users', 'matches', 'predictions', 'app_cache'];
  const dumpData = {};

  for (const table of tables) {
    console.log(`Baixando dados da tabela: ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Erro ao baixar ${table}:`, error);
    } else {
      dumpData[table] = data;
      console.log(`- ${data.length} registros salvos.`);
    }
  }

  fs.writeFileSync('db_dump.json', JSON.stringify(dumpData, null, 2));
  console.log('Dump concluído com sucesso no arquivo db_dump.json!');
  console.log('Tamanho do dump: ' + (fs.statSync('db_dump.json').size / 1024).toFixed(2) + ' KB');
}

dump();

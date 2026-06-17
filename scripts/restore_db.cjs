const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// New Project details
const SUPABASE_URL = 'https://yksgboovrizxfxaxyjni.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function restore() {
  console.log('Iniciando o restore no banco novo...');
  
  const dumpFile = 'db_dump.json';
  if (!fs.existsSync(dumpFile)) {
    console.error('Arquivo db_dump.json não encontrado!');
    return;
  }

  const dumpData = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));
  
  // Primeiro, vamos recriar as contas no Supabase Auth usando o Admin API!
  // Como não temos a senha antiga, vamos definir uma senha padrão para todos.
  const DEFAULT_PASSWORD = 'bolao2026_senha_segura';
  console.log('================================================');
  console.log('Migrando Autenticação (Supabase Auth)...');
  console.log(`Todos os usuários terão a senha temporária: ${DEFAULT_PASSWORD}`);
  console.log('Eles deverão fazer login e trocar a senha depois.');
  console.log('================================================');

  const newAuthIds = {};

  for (let i = 0; i < dumpData.users.length; i++) {
    const user = dumpData.users[i];
    if (user.email && user.email.includes('@')) {
      console.log(`Recriando Auth para: ${user.email} (${user.name})...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.status === 422) {
          console.log(`  - E-mail já existe no novo Auth, buscando ID...`);
          // Busca o ID do usuário se ele já existe
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === user.email);
          if (existingUser) {
            user.auth_id = existingUser.id;
            console.log(`  - Reutilizando ID: ${existingUser.id}`);
          }
        } else {
          console.error(`  - Erro ao criar Auth para ${user.email}:`, authError);
        }
      } else {
        user.auth_id = authData.user.id;
        console.log(`  - Sucesso! Novo Auth ID: ${authData.user.id}`);
      }
    } else {
      console.log(`Aviso: Usuário ${user.name} não possui um e-mail válido para criar no Auth.`);
    }
  }

  console.log('\\nRestaurando tabelas do banco de dados...');
  const tables = ['leagues', 'users', 'matches', 'predictions', 'app_cache'];

  for (const table of tables) {
    if (dumpData[table] && dumpData[table].length > 0) {
      console.log(`Restaurando ${dumpData[table].length} registros na tabela ${table}...`);
      
      const { data, error } = await supabase.from(table).upsert(dumpData[table]);
      
      if (error) {
        console.error(`Erro ao restaurar ${table}:`, error);
      } else {
        console.log(`- ${table} restaurado com sucesso!`);
      }
    } else {
      console.log(`Tabela ${table} estava vazia ou não encontrada no dump.`);
    }
  }

  console.log('Restore finalizado!');
}

restore();

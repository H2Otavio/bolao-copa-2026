-- Correções do schema para compatibilidade com os dados restaurados

-- 1. Tabela Matches: cup_group pode ser R32, FINAL, etc.
ALTER TABLE matches ALTER COLUMN cup_group TYPE VARCHAR(10);

-- 2. Tabela Users: precisa de auth_id e email
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Forçar atualização do cache da API do Supabase
NOTIFY pgrst, 'reload schema';

-- DELETAR TODOS OS USUÁRIOS ANTIGOS (Isto deletará palpites associados em cascata se configurado)
TRUNCATE TABLE users CASCADE;

-- Tentar remover a constraint única anterior (name, league_id) caso ela exista com nome padrão
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_name_league_id_key;

-- Adicionar a coluna de senha obrigatória
ALTER TABLE users ADD COLUMN password TEXT NOT NULL;

-- Fazer com que o nome de usuário seja único em todo o banco de dados
-- Isso permite o login usando apenas NOME e SENHA.
ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name);

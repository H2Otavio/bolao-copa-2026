

-- File: sql/schema.sql
-- ============================================================
-- BOLÃO DA COPA 2026 — Schema SQL para Supabase
-- Execute este bloco inteiro no SQL Editor do Supabase
-- ============================================================

-- 1. LEAGUES (Grupos/Ligas do Bolão)
CREATE TABLE leagues (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  admin_name                TEXT NOT NULL,
  can_view_global_ranking   BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- 2. USERS (Participantes)
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, league_id)
);

-- 3. MATCHES (Jogos da Copa)
CREATE TABLE matches (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cup_group     CHAR(1) NOT NULL,
  team_home     TEXT NOT NULL,
  team_away     TEXT NOT NULL,
  flag_home     TEXT,
  flag_away     TEXT,
  match_date    TIMESTAMPTZ,
  score_home    INTEGER,
  score_away    INTEGER,
  match_number  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. PREDICTIONS (Palpites dos Usuários)
CREATE TABLE predictions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  score_home  INTEGER NOT NULL CHECK (score_home >= 0),
  score_away  INTEGER NOT NULL CHECK (score_away >= 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- ÍNDICES
CREATE INDEX idx_users_league ON users(league_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_matches_group ON matches(cup_group);

-- RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leagues_select" ON leagues FOR SELECT USING (true);
CREATE POLICY "leagues_insert" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "leagues_update" ON leagues FOR UPDATE USING (true);
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_update" ON matches FOR UPDATE USING (true);
CREATE POLICY "predictions_all" ON predictions FOR ALL USING (true) WITH CHECK (true);


-- File: sql/add_password_and_unique_name.sql
-- DELETAR TODOS OS USUÁRIOS ANTIGOS (Isto deletará palpites associados em cascata se configurado)
TRUNCATE TABLE users CASCADE;

-- Tentar remover a constraint única anterior (name, league_id) caso ela exista com nome padrão
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_name_league_id_key;

-- Adicionar a coluna de senha obrigatória
ALTER TABLE users ADD COLUMN password TEXT NOT NULL;

-- Fazer com que o nome de usuário seja único em todo o banco de dados
-- Isso permite o login usando apenas NOME e SENHA.
ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name);


-- File: sql/create_admin_table.sql
-- Tabela de Administradores Globais
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir usuário admin padrão (Recomenda-se alterar a senha posteriormente via banco)
INSERT INTO admins (username, password) VALUES ('admin', 'admin@2026!') ON CONFLICT DO NOTHING;


-- File: sql/update_predictions.sql
-- ============================================================
-- ATUALIZAÇÃO: Simulador de Mata-Mata
-- ============================================================

-- Adiciona suporte para distinguir palpites reais de simulações
ALTER TABLE predictions ADD COLUMN is_simulated BOOLEAN DEFAULT TRUE;

-- Armazena quais times o usuário imaginou que jogariam essa partida na simulação dele
ALTER TABLE predictions ADD COLUMN simulated_team_home VARCHAR(255);
ALTER TABLE predictions ADD COLUMN simulated_team_away VARCHAR(255);

-- Para jogos de mata-mata que terminam em empate, o id do time que avança nos pênaltis
ALTER TABLE predictions ADD COLUMN advance_on_penalties VARCHAR(255);


-- File: supabase/migrations/20260609_add_penalties_matches.sql
-- Add advance_on_penalties to matches table to handle real-world draws in knockout
ALTER TABLE matches ADD COLUMN IF NOT EXISTS advance_on_penalties TEXT;


-- File: C:/Users/Otavio/.gemini/antigravity/brain/f9075341-269b-4de9-bd44-f2910e8f08b7/create_view.sql
CREATE OR REPLACE VIEW vw_user_rankings AS
WITH match_results AS (
  SELECT id, cup_group, team_home, team_away, score_home, score_away, 
         (length(cup_group) > 1) as is_knockout
  FROM matches
  WHERE score_home IS NOT NULL AND score_away IS NOT NULL
),
user_points AS (
  SELECT 
    p.user_id,
    p.match_id,
    p.updated_at,
    -- Team points (Mata-Mata)
    CASE WHEN m.is_knockout THEN
      (CASE WHEN p.simulated_team_home = m.team_home THEN 2 ELSE 0 END) +
      (CASE WHEN p.simulated_team_away = m.team_away THEN 2 ELSE 0 END)
    ELSE 0 END as team_points,
    
    -- Score validity rule
    CASE 
      WHEN NOT m.is_knockout THEN true
      WHEN NOT p.is_simulated THEN true
      WHEN p.simulated_team_home = m.team_home AND p.simulated_team_away = m.team_away THEN true
      ELSE false
    END as is_score_valid,
    
    p.score_home as ph, p.score_away as pa, m.score_home as mh, m.score_away as ma
  FROM predictions p
  JOIN match_results m ON p.match_id = m.id
  WHERE p.score_home IS NOT NULL AND p.score_away IS NOT NULL
),
scored_points AS (
  SELECT
    user_id,
    team_points,
    EXTRACT(EPOCH FROM updated_at) as order_val,
    CASE WHEN is_score_valid THEN
      CASE 
        WHEN ph = mh AND pa = ma THEN 5
        WHEN sign(ph - pa) = sign(mh - ma) AND (ph = mh OR pa = ma) THEN 4
        WHEN sign(ph - pa) = sign(mh - ma) THEN 3
        ELSE 0
      END
    ELSE 0 END as score_points,
    
    CASE WHEN is_score_valid AND ph = mh AND pa = ma THEN 1 ELSE 0 END as exact_both_points,
    CASE WHEN is_score_valid AND sign(ph - pa) = sign(mh - ma) THEN 1 ELSE 0 END as correct_results
  FROM user_points
),
user_totals AS (
  SELECT
    user_id,
    SUM(team_points + score_points) as total_points,
    SUM(exact_both_points) as total_exact_both,
    SUM(correct_results) as total_correct_results,
    AVG(order_val) as avg_order
  FROM scored_points
  GROUP BY user_id
)
SELECT 
  u.id,
  u.name,
  u.league_id,
  COALESCE(ut.total_points, 0) as "totalPoints",
  COALESCE(ut.total_exact_both, 0) as "exactBothPoints",
  COALESCE(ut.total_correct_results, 0) as "correctResults",
  COALESCE(ut.avg_order, 9999999999) as "avgOrder"
FROM users u
LEFT JOIN user_totals ut ON u.id = ut.user_id;


-- File: app_cache
CREATE TABLE IF NOT EXISTS public.app_cache (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.app_cache FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.app_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.app_cache FOR UPDATE USING (true);

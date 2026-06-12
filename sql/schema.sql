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

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

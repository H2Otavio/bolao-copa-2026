-- Add advance_on_penalties to matches table to handle real-world draws in knockout
ALTER TABLE matches ADD COLUMN IF NOT EXISTS advance_on_penalties TEXT;

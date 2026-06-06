-- Tabela de Administradores Globais
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir usuário admin padrão (Recomenda-se alterar a senha posteriormente via banco)
INSERT INTO admins (username, password) VALUES ('admin', 'admin@2026!') ON CONFLICT DO NOTHING;

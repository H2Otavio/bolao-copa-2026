-- Passo 1: Adicionar a coluna auth_id para linkar com a Autenticação Nativa
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Passo 2: Adicionar a coluna email para uso e exibição local
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Passo 3 (Opcional mas recomendado): Fazer com que auth_id seja único
ALTER TABLE public.users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);

# Bolão Copa do Mundo 2026 ⚽🏆

Um aplicativo web moderno e interativo para gerenciar grupos de palpites da **Copa do Mundo FIFA de 2026**. Construído com **React**, **Vite**, **Tailwind CSS** e banco de dados **Supabase** (PostgreSQL).

## ✨ Funcionalidades Principais

* **Plataforma Multigrupos:** Um Administrador Global pode criar diversas ligas e compartilhar códigos de convite (`Ex: EMPRESA123`).
* **Cadastro e Segurança:** Usuários comuns entram nas ligas através de cadastro com senha protegida e criptografada (Hash) com `bcryptjs`.
* **Resultados em Tempo Real:** O sistema busca ativamente os resultados das partidas da Copa de 2026 usando uma integração com a API Open Source [worldcup2026](https://github.com/rezarahiminia/worldcup2026).
* **Ranking Dinâmico:** Atualização automática do ranking de usuários baseada em regras clássicas de bolão:
  * Acerto exato do placar = 10 pontos
  * Acerto do vencedor e saldo de gols = 7 pontos
  * Acerto do vencedor apenas = 5 pontos
* **Modo Administrador Global:** Painel estilo "WordPress" escondido na rota `/admin-login` para gerenciamento absoluto do sistema.

## 💻 Stack Tecnológica

- **Frontend:** React (SPA), Vite, Tailwind CSS (Vanilla CSS para design system).
- **Backend / Database:** Supabase (PostgreSQL).
- **Autenticação:** Gerenciamento local de estado (Local Storage) + Hashes seguras com `bcryptjs`.
- **Hospedagem Recomendada:** Vercel, Netlify ou Render (Frontend) / Supabase Cloud (Banco).

## 🚀 Como rodar o projeto localmente

### 1. Clonando e Instalando Dependências

```bash
git clone https://github.com/H2Otavio/bolao-copa-2026.git
cd bolao-copa-2026
npm install
```

### 2. Configurando Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as suas chaves do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

### 3. Configurando o Banco de Dados (Supabase)

No seu painel do Supabase, vá até o **SQL Editor** e rode os scripts localizados na pasta `sql/` na seguinte ordem:

1. `sql/schema.sql` (Cria a estrutura base de ligas, usuários e palpites)
2. `sql/seed_104_matches.sql` (Popula a tabela de jogos com as 104 partidas oficiais da Copa 2026)
3. `sql/create_admin_table.sql` (Cria o perfil do Administrador Global)
4. `sql/add_password_and_unique_name.sql` (Prepara a arquitetura segura para as senhas de usuários comuns)

*Observação: Lembre-se de desativar o RLS (Row Level Security) na tabela `admins` para o login funcionar perfeitamente.*

### 4. Rodando o Aplicativo

```bash
npm run dev
```
Abra o navegador em `http://localhost:5173`.

## ⚙️ Acessos e Rotas

- **Acesso Comum (Jogadores):** `http://localhost:5173/` (Cadastro / Login)
- **Acesso Admin Global:** `http://localhost:5173/admin-login` (Credenciais padrão no banco: admin / admin123)

## 🤝 Autor

Desenvolvido para fins de simulação e uso recreativo na Copa do Mundo de 2026.

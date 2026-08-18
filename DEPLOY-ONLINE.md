# Deploy sem localhost

O projeto foi preparado para **Vercel + Supabase**.

### Supabase
- Projeto novo: execute `supabase/schema.sql` e depois `supabase/seed.sql`.
- Projeto que já usa a v2.1: execute apenas `supabase/upgrade-v2.2-admin.sql` para adicionar o painel ADM sem apagar os dados existentes.
- Copie `Project URL` e `secret key` em Settings/API.

### Vercel
Adicione as variáveis:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `STUDIORIUM_ADMIN_EMAIL`

Depois publique o projeto. O endereço final será HTTPS público da Vercel ou seu domínio próprio.

### Importante
A `SUPABASE_SECRET_KEY` é secreta. Ela existe somente nas variáveis do servidor da Vercel e nunca no JavaScript servido ao navegador.

### Administrador
Cadastre-se usando o e-mail definido em `STUDIORIUM_ADMIN_EMAIL`. Depois do login, abra `/admin`.

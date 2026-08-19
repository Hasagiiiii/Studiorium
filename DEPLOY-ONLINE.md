# Deploy sem localhost

O projeto foi preparado para **Vercel + Supabase**.

## Supabase

- Em um projeto novo, execute `supabase/schema.sql` e depois `supabase/seed.sql`.
- Em um projeto existente, aplique somente as migrações `supabase/upgrade-*.sql` ainda não
  registradas, sempre na ordem de versão.
- Para liberar os recursos 3.1, aplique `supabase/upgrade-v3.1-community-identity.sql` antes do
  deploy do código correspondente.
- Em seguida, aplique `supabase/upgrade-v3.1.1-local-moderation-public-projects.sql` para liberar
  projetos públicos. A moderação local não exige chave de IA.
- Confirme que o bucket privado `publications` existe e que as tabelas não concedem acesso a
  `anon` ou `authenticated`.
- Copie `Project URL` e `secret key` em Settings/API.

## Administrador

A conta principal não pode ser criada pelo cadastro público nem promovida automaticamente por
e-mail. Para provisioná-la uma única vez, defina temporariamente as quatro variáveis abaixo no
terminal local e execute:

```bash
npm run provision-admin
```

Variáveis necessárias ao comando: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
`STUDIORIUM_ADMIN_EMAIL` e `STUDIORIUM_ADMIN_PASSWORD`. A senha deve ter de 12 a 128 caracteres.
Remova `STUDIORIUM_ADMIN_PASSWORD` do ambiente ao terminar; ela não pertence à Vercel.

## Vercel

Adicione as variáveis:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `STUDIORIUM_ADMIN_EMAIL`

Depois publique o projeto. O endereço final será HTTPS público da Vercel ou seu domínio próprio.

Execute `npm ci`, `npm run check` e `npm test` antes de publicar. O endpoint `/api/health` deve
responder com estado saudável depois que as variáveis estiverem configuradas.

## Importante

A `SUPABASE_SECRET_KEY` é secreta. Ela existe somente nas variáveis do servidor da Vercel e nunca no JavaScript servido ao navegador.

Depois do provisionamento, entre com `STUDIORIUM_ADMIN_EMAIL` e abra `/admin`.

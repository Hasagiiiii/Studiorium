# Studiorium Online 2.2

Versão reorganizada do Studiorium para publicação online. Não depende de servidor executado no computador, banco JSON em disco ou pasta de uploads local.

## Arquitetura

- `public/` — interface dark academia e SPA.
- `public/js/runtime.js` — estado, API e utilitários.
- `public/js/views.js` — telas e componentes visuais.
- `public/js/router.js` — navegação SPA.
- `public/js/events.js` — formulários, cliques e interações.
- `api/index.js` — entrada única da função Vercel.
- `src/server/routes/` — endpoints divididos por domínio.
- `src/server/auth.js` — sessões e autorização.
- `src/server/security.js` — hash, IDs, tokens e slugs.
- `src/server/moderation.js` — primeira barreira de moderação.
- `src/server/db.js` — conexão privada com Supabase.
- `supabase/schema.sql` e `supabase/seed.sql` — banco online e conteúdo inicial.
- `supabase/upgrade-v2.2-admin.sql` — atualização para quem já criou o banco da v2.1.

## Publicação online

1. Crie o banco no Supabase e execute `supabase/schema.sql` e depois `supabase/seed.sql`.
2. Crie um projeto na Vercel importando esta pasta/ZIP.
3. Configure as variáveis `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `STUDIORIUM_ADMIN_EMAIL`.
4. Faça o deploy. A Vercel servirá `public/` e executará a API em `/api`.
5. Cadastre no Studiorium usando o e-mail definido em `STUDIORIUM_ADMIN_EMAIL`; essa conta recebe função de administrador sem senha fixa no código.

## Segurança aplicada

- Senhas com `scrypt` + salt.
- Token de sessão armazenado no banco apenas como SHA-256.
- Cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- RLS habilitado no Supabase; navegador não recebe secret key.
- Upload privado no Storage, com link assinado curto para download.
- Extensões/MIME limitados e arquivo máximo de 5 MB.
- Verificação de origem em operações mutáveis.
- CSP, `nosniff`, Referrer Policy e Permissions Policy.
- Menores começam com perfil privado e autoria pública protegida.

## Validação

Execute `npm run check` e `npm test` em CI ou antes de publicar uma nova versão. Não é necessário executar um servidor local para usar o site em produção.


## Biblioteca

A rota `/biblioteca` é o catálogo central do Studiorium. Ela pesquisa publicações e modelos e oferece filtros por tipo, área, nível, autor e palavra-chave, com acesso direto aos perfis públicos dos autores. O **Acervo** permanece separado e contém apenas os templates/modelos para criação. A busca da página inicial direciona para a Biblioteca.

## Painel ADM

A conta definida em `STUDIORIUM_ADMIN_EMAIL` acessa `/admin`. O painel inclui visão geral, moderação, usuários, publicações, Colóquio, Acervo, configurações e registro administrativo. Suspensões encerram sessões ativas; conteúdos são ocultados/rejeitados em vez de apagados por padrão. As ações administrativas ficam registradas em `admin_audit_log`.

Se você já executou o banco da **v2.1**, não precisa apagar nada: execute `supabase/upgrade-v2.2-admin.sql` no SQL Editor e faça o deploy da v2.2.

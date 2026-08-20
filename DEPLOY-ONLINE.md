# Deploy sem localhost

O projeto foi preparado para **Vercel + Supabase**.

## Supabase

- Em um projeto novo, execute `supabase/schema.sql` e depois `supabase/seed.sql`.
- Em qualquer projeto, aplique somente as migrações `supabase/upgrade-*.sql` ainda não registradas,
  sempre na ordem de versão. Isso também vale para uma instalação nova quando o `schema.sql` ainda
  não incorporou a versão mais recente.
- Para liberar os recursos 3.1, aplique `supabase/upgrade-v3.1-community-identity.sql` antes do
  deploy do código correspondente.
- Em seguida, aplique `supabase/upgrade-v3.1.1-local-moderation-public-projects.sql` para liberar
  projetos públicos. A moderação local não exige chave de IA.
- Para o **Armarium Librorum** comunitário, aplique `supabase/upgrade-v3.2-armarium-community.sql`.
  Essa migração remove apenas os seis livros demonstrativos da v3.1 e cria reviews, capas, links e
  métricas da estante real.
- Depois aplique `supabase/upgrade-v3.2.1-armarium-indexes.sql` para os índices recomendados pelo
  Performance Advisor.
- Para ativar **Comunidades 3.4**, aplique `supabase/upgrade-v3.4-communities.sql` antes de publicar
  o código correspondente. A migração cria comunidades oficiais, membros, papéis locais e vínculos
  entre a comunidade e conteúdos existentes sem duplicar discussões ou materiais da Oficina.
- Em Comunidades, participação voluntária (`active`/`left`) e moderação (`clear`/`muted`/`removed`)
  são estados separados. Não altere esses campos manualmente para contornar a API.
- Cada conteúdo possui uma comunidade principal nessa versão. O índice
  `community_content_single_parent_idx` protege esse contrato no banco.
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

Opcionalmente, depois de aderir ao programa correspondente e configurar sua identificação de
afiliado, adicione:

- `STUDIORIUM_AMAZON_AFFILIATE_TAG`

Sem essa variável, o Armarium continua funcionando normalmente e abre apenas uma busca comum da
Amazon Brasil.

Depois publique o projeto. O endereço final será HTTPS público da Vercel ou seu domínio próprio.

Execute `npm ci`, `npm run check` e `npm test` antes de publicar. O endpoint `/api/health` deve
responder com estado saudável depois que as variáveis estiverem configuradas.

## Importante

A `SUPABASE_SECRET_KEY` é secreta. Ela existe somente nas variáveis do servidor da Vercel e nunca no
JavaScript servido ao navegador.

Depois do provisionamento, entre com `STUDIORIUM_ADMIN_EMAIL` e abra `/admin`.

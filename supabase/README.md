# Banco online (Supabase)

## Instalação nova

1. Crie um projeto Supabase.
2. No SQL Editor, execute `schema.sql`.
3. Execute `upgrade-v2.4-security.sql` para ativar limitação de tentativas de login e auditoria de segurança.
4. Execute `seed.sql` para carregar o acervo inicial.
5. Copie a URL do projeto e a **secret key** para as variáveis da Vercel.
6. Defina `STUDIORIUM_ADMIN_EMAIL` na Vercel com o e-mail da conta que será a administradora principal.
7. Nunca coloque a secret key, senha de ADM ou qualquer `.env` real em `public/`, Git ou código do navegador.

O bucket privado `publications` é criado pelo `schema.sql`. Downloads usam URL assinada por 60 segundos.

## Atualizações

### v2.1 → v2.2
Execute `upgrade-v2.2-admin.sql`. Ele adiciona status de usuários, destaques de publicações, configurações do site e o registro administrativo sem excluir os dados existentes.

### v2.2 → v2.3
Execute `upgrade-v2.3-tech-lab.sql` para adicionar recursos de tecnologia e projetos do laboratório de código.

### v2.3 → v2.4
Execute `upgrade-v2.4-security.sql`. Ele adiciona proteção persistente contra força bruta e eventos de segurança sem armazenar IP ou e-mail em texto puro.

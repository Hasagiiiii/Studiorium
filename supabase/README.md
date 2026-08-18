# Banco online (Supabase)

## Instalação nova

1. Crie um projeto Supabase.
2. No SQL Editor, execute `schema.sql`.
3. Execute `upgrade-v2.4-security.sql`.
4. Execute `upgrade-v2.4.1-security-compat.sql`.
5. Execute `upgrade-v2.5-admin-bootstrap.sql`.
6. Execute `upgrade-v2.6-performance.sql`.
7. Execute `upgrade-v2.6.1-revoke-client-grants.sql`.
8. Execute `seed.sql` para carregar o acervo inicial.
9. Configure a hospedagem com a URL do projeto e uma **secret key** apenas no ambiente do backend.
10. O ADM principal padrão desta instalação é `umaduplagamer@gmail.com`. A variável `STUDIORIUM_ADMIN_EMAIL` pode sobrescrever esse valor em outra instalação.
11. Nunca coloque a secret key, senha de ADM ou qualquer `.env` real em `public/`, Git ou código do navegador.

O bucket privado `publications` é criado pelo `schema.sql`. Downloads usam URL assinada por 60 segundos.

## Atualizações

### v2.1 → v2.2
Execute `upgrade-v2.2-admin.sql`. Ele adiciona status de usuários, destaques de publicações, configurações do site e o registro administrativo sem excluir os dados existentes.

### v2.2 → v2.3
Execute `upgrade-v2.3-tech-lab.sql` para adicionar recursos de tecnologia e projetos do laboratório de código.

### v2.3 → v2.4
Execute `upgrade-v2.4-security.sql` e depois `upgrade-v2.4.1-security-compat.sql`. Eles adicionam proteção persistente contra força bruta e eventos de segurança sem armazenar IP ou e-mail em texto puro, além da compatibilidade das colunas de auditoria.

### v2.4 → v2.5
Execute `upgrade-v2.5-admin-bootstrap.sql`. Ele permite provisionar a conta administrativa principal separadamente do cadastro público. O sistema não promove mais uma conta a ADM apenas porque o e-mail coincide com o e-mail reservado.

### v2.5 → v2.6
Execute `upgrade-v2.6-performance.sql`. Ele adiciona índices para chaves estrangeiras usadas por projetos, denúncias e recursos da Oficina, eliminando os avisos de foreign keys sem índice do Database Linter.

### v2.6 → v2.6.1
Execute `upgrade-v2.6.1-revoke-client-grants.sql`. Ele remove os grants diretos de `anon` e `authenticated` das tabelas, sequências e RPCs internos. O acesso legítimo continua exclusivamente pela API com `service_role`.

## RLS

As tabelas de aplicação usam RLS e, nesta arquitetura, não possuem políticas públicas deliberadamente: o navegador chama a API do Studiorium e a API acessa o banco com credencial privada de servidor. Além do RLS, a v2.6.1 revoga os privilégios diretos de `anon` e `authenticated`. Por isso o Database Linter pode mostrar avisos informativos `RLS Enabled No Policy`; eles representam bloqueio do acesso direto do cliente, não abertura pública do banco.

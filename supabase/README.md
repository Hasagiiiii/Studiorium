# Banco online (Supabase)

## Instalação nova

1. Crie um projeto Supabase.
2. No SQL Editor, execute `schema.sql`.
3. Execute `upgrade-v2.4-security.sql`.
4. Execute `upgrade-v2.4.1-security-compat.sql`.
5. Execute `upgrade-v2.5-admin-bootstrap.sql`.
6. Execute `seed.sql` para carregar o acervo inicial.
7. Configure a hospedagem com a URL do projeto e uma **secret key** apenas no ambiente do backend.
8. O ADM principal padrão desta instalação é `umaduplagamer@gmail.com`. A variável `STUDIORIUM_ADMIN_EMAIL` pode sobrescrever esse valor em outra instalação.
9. Nunca coloque a secret key, senha de ADM ou qualquer `.env` real em `public/`, Git ou código do navegador.

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

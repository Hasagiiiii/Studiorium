# Banco online (Supabase)

1. Crie um projeto Supabase.
2. No SQL Editor, execute `schema.sql`.
3. Depois execute `seed.sql` para carregar o acervo inicial.
4. Copie a URL do projeto e a **secret key** para as variáveis da Vercel.
5. Nunca coloque a secret key em `public/`, Git ou código do navegador.

O bucket privado `publications` é criado pelo `schema.sql`. Downloads usam URL assinada por 60 segundos.

## Atualização da v2.1 para v2.2
Se o banco da v2.1 já existe, execute `upgrade-v2.2-admin.sql`. Ele adiciona status de usuários, destaques de publicações, configurações do site e o registro administrativo sem excluir os dados existentes.

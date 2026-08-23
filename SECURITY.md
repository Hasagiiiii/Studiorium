# Segurança do Studiorium

## Segredos e variáveis de ambiente

Credenciais reais nunca devem ser versionadas. O repositório mantém apenas `.env.example`, com nomes de variáveis e valores fictícios.

Segredos de produção devem ficar nas variáveis de ambiente da Vercel. Para desenvolvimento local, use um arquivo `.env.local` ou outro arquivo ignorado pelo Git.

Nunca coloque credenciais secretas em variáveis destinadas ao navegador, arquivos de `public/`, documentação, testes, logs, issues ou mensagens de commit.

## Credenciais que devem permanecer privadas

- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, quando houver compatibilidade legada
- `RESEND_API_KEY`
- `STUDIORIUM_ADMIN_PASSWORD`
- senhas de banco de dados
- tokens de serviços externos
- chaves privadas e certificados que contenham material privado

`SUPABASE_URL` e chaves explicitamente classificadas pelo provedor como publicáveis não devem ser confundidas com chaves secretas.

## Prevenção de vazamentos

O CI executa `node scripts/check-secrets.js`. A verificação analisa os arquivos rastreados e o histórico Git disponível sem imprimir o valor de uma possível credencial encontrada.

Se a verificação bloquear um commit, não contorne o teste. Remova a credencial, rotacione a chave no provedor e atualize somente a variável protegida do ambiente.

## Resposta a incidente

Se uma credencial real chegar a um repositório público, considere-a comprometida mesmo depois de apagar o arquivo ou tornar o repositório privado.

1. Revogue ou rotacione a credencial no provedor correspondente.
2. Atualize a credencial na Vercel e nos ambientes autorizados.
3. Remova o segredo do código e do histórico Git quando necessário.
4. Verifique logs e eventos de segurança em busca de uso indevido.
5. Execute novamente os testes e a verificação de segredos antes de publicar.

## Banco de dados

A chave secreta do Supabase é exclusiva do backend. O navegador não deve recebê-la. Alterações de permissões, RLS ou funções privilegiadas devem ser revisadas antes de chegar à produção.

# Segurança do Studiorium

## Segredos e variáveis de ambiente

Credenciais reais nunca devem ser versionadas. O repositório mantém apenas `.env.example`, com nomes de variáveis e valores fictícios.

Segredos de produção ficam nas variáveis protegidas do provedor de hospedagem. Em desenvolvimento, use apenas arquivos de ambiente ignorados pelo Git.

Nunca coloque credenciais secretas em arquivos públicos, documentação, testes, logs, issues ou mensagens de commit.

## Credenciais privadas

- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, quando houver compatibilidade legada
- `RESEND_API_KEY`
- `STUDIORIUM_ADMIN_PASSWORD`
- senhas de banco de dados
- tokens de serviços externos
- chaves privadas e certificados

`SUPABASE_URL` e chaves explicitamente classificadas pelo provedor como publicáveis não devem ser confundidas com credenciais secretas.

## Prevenção de vazamentos

O CI executa `node scripts/check-secrets.js`. A verificação examina arquivos rastreados e o histórico Git disponível sem imprimir o valor de uma possível credencial encontrada.

Se a verificação bloquear um commit, não contorne o teste. Remova a credencial, rotacione a chave no provedor e atualize somente a variável protegida do ambiente.

## Resposta a incidente

Se uma credencial real chegar a um repositório público, considere-a comprometida mesmo depois de apagar o arquivo ou tornar o repositório privado.

1. Revogue ou rotacione a credencial no provedor correspondente.
2. Atualize a credencial nos ambientes autorizados.
3. Remova o segredo do código e do histórico Git quando necessário.
4. Verifique logs e eventos de segurança em busca de uso indevido.
5. Execute novamente os testes e a verificação de segredos antes de publicar.

## Banco de dados

A chave secreta do Supabase é exclusiva do backend. O navegador não deve recebê-la. Alterações de permissões, RLS ou funções privilegiadas precisam de revisão antes da produção.

Na arquitetura v4, o cliente não consulta tabelas do Supabase diretamente. O pacote `@lorion/database` existe apenas no backend e usa a credencial de Service Role. Por isso, tabelas com RLS habilitado e sem policies públicas representam uma postura intencional de negação por padrão para acessos `anon` e `authenticated`; autorização e regras de negócio permanecem na API do Lorion. Uma policy pública só deve ser criada se o produto adotar deliberadamente acesso direto do cliente a uma tabela específica.

Avisos de índices marcados apenas como `unused_index` não devem motivar remoção automática em bancos novos ou com pouco tráfego. Uso real e planos de consulta precisam ser observados antes de eliminar índices.

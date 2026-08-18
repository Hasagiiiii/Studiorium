# Infraestrutura Supabase do Studiorium

Este diretório reúne os arquivos de banco de dados e funções de backend usados pelo Studiorium.

## Conteúdo

- `schema.sql` — estrutura principal do banco;
- `seed.sql` — conteúdo inicial de demonstração;
- `upgrade-*.sql` — migrações incrementais do projeto;
- `functions/` — funções Edge utilizadas pela aplicação web.

## Princípios

- credenciais de produção não são versionadas;
- senhas, chaves privadas e arquivos `.env` reais não devem ser enviados ao GitHub;
- o frontend não deve receber credenciais administrativas do banco;
- arquivos de usuários permanecem separados da documentação pública do projeto;
- alterações estruturais do banco devem ser feitas por migrações versionadas.

## Ambiente de produção

A configuração operacional da instância de produção, identidade administrativa, credenciais, procedimentos de recuperação e demais informações sensíveis não fazem parte desta documentação pública.

Este diretório existe para manter o histórico técnico do schema e das migrações necessárias ao desenvolvimento do Studiorium.

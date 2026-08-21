# Arquitetura de dados do Studiorium

Este documento define as convenções de dados e governança que devem orientar a evolução do Studiorium. O objetivo é crescer sem misturar autenticação, conteúdo, moderação e permissões em estruturas improvisadas ou incompatíveis entre versões.

## Princípios

- Alterações de schema devem ser aditivas e versionadas sempre que possível.
- A API é a fronteira entre navegador e dados sensíveis; credenciais de servidor nunca são expostas ao cliente.
- Integridade deve ser protegida no banco com chaves, constraints e índices, sem depender apenas do JavaScript.
- Dados legados não devem ser apagados ou reescritos apenas para simplificar uma migração.
- Exclusão lógica é preferida para conteúdo moderável ou recuperável; exclusão física fica reservada a rotinas explícitas de retenção e limpeza.
- Auditoria administrativa é imutável do ponto de vista da aplicação comum.

## Domínios

A arquitetura deve tratar como contextos distintos: identidade e sessão, perfil público, autorização global, comunidades, conteúdo acadêmico, discussões, projetos, biblioteca, notícias, moderação, notificações, auditoria e segurança.

Uma tabela pode referenciar outra quando a relação é estrutural, mas regras de negócio entre domínios devem permanecer na camada de aplicação em vez de espalhadas por rotas e componentes do frontend.

## Identidade e perfil

`users` representa a identidade operacional da aplicação e o estado da conta. `profiles` representa a identidade pública e acadêmica. Dados de apresentação, formação e verificação não devem ser utilizados como mecanismo de autorização.

A autenticação atual continua baseada nas tabelas privadas de aplicação `users` e `sessions`. Uma eventual migração para outro provedor de identidade deve ser um projeto separado, com compatibilidade e plano de migração explícitos.

## Autorização global

A partir da fundação v3.5, a autorização global passa a ter as entidades `roles`, `permissions`, `role_permissions` e `user_roles`.

Durante a transição, `users.role` permanece como cargo nativo principal e fonte de compatibilidade para `user`, `curator`, `editor`, `moderator` e `admin`. Cargos adicionais podem ser modelados no RBAC sem reutilizar campos de perfil ou criar flags administrativas espalhadas pelo banco.

Uma permissão representa uma capacidade, como `moderation.content` ou `roles.manage`. Código novo deve preferir autorização por capacidade quando isso expressar melhor a regra de negócio.

## Permissões de comunidades

Cargos locais de comunidades são independentes dos cargos globais. Um usuário pode ser moderador de uma comunidade sem ser moderador global do Studiorium. `community_members` continua sendo a fonte dessa relação local.

A aplicação deve evitar transformar cargo global em cargo local automaticamente, exceto quando houver uma regra administrativa deliberada e auditável.

## IDs

O projeto já possui IDs textuais prefixados em diversos domínios. Eles permanecem válidos durante esta fase. Trocar todos os IDs por UUID apenas por estética adicionaria risco sem benefício imediato.

Novos formatos de ID devem ser introduzidos somente com convenção centralizada, testes e migração própria. Relações devem utilizar o mesmo tipo da chave referenciada.

## Datas

Datas persistidas devem utilizar `timestamptz` e ser tratadas em UTC no banco. Entidades mutáveis devem ter `created_at` e `updated_at`. Entidades sujeitas a recuperação, moderação ou retenção devem adotar `deleted_at` quando a exclusão lógica fizer sentido.

## Soft delete

Consultas de conteúdo ativo devem excluir linhas com `deleted_at` preenchido. A exclusão lógica não substitui políticas de retenção: uma rotina administrativa futura poderá remover definitivamente dados expirados quando houver justificativa técnica, legal ou operacional.

Ações de moderação não devem depender de apagar fisicamente conteúdo para escondê-lo.

## Auditoria

Ações administrativas relevantes devem registrar ator, ação, alvo, metadados mínimos e horário. Dados secretos, senha, token de sessão e credenciais nunca entram em logs de auditoria.

Mudanças de cargo, suspensão de conta, aprovação de verificação, alteração de configuração e decisões de moderação são exemplos de eventos auditáveis.

## Arquivos

Arquivos binários pertencem ao Object Storage. O PostgreSQL guarda metadados, ownership e referências de storage. Não armazenar imagens, PDFs ou outros binários grandes diretamente em colunas comuns do banco.

## Constraints e índices

Constraints devem proteger invariantes simples, como estados permitidos, contadores não negativos e unicidade. Foreign Keys devem ser adicionadas quando os dados existentes satisfizerem a relação; dados legados órfãos devem ser reconciliados antes de validar novas FKs.

Foreign Keys usadas em buscas, joins ou cascatas devem possuir índices de cobertura apropriados. Índices marcados como não utilizados não devem ser removidos apenas com base em uma amostra curta de produção.

## RLS e Data API

O modelo atual mantém RLS habilitado e revoga acesso de `public`, `anon` e `authenticated` às tabelas privadas, enquanto a API de servidor utiliza a credencial privilegiada. Por isso, avisos informativos de RLS sem policy podem existir nesse desenho.

Se alguma tabela passar a ser acessada diretamente pelo cliente no futuro, ela deverá receber grants mínimos e policies de RLS específicas antes da exposição. `service_role` nunca pode ser enviado ao navegador.

## Ambientes

Development, Preview/Staging e Production devem utilizar configurações e bancos separados sempre que a infraestrutura permitir. Deploy de Preview não deve escrever no banco de produção.

Mudanças de schema devem ser testadas antes de produção e registradas em histórico de migração. Nunca usar alteração manual não documentada como fluxo normal de manutenção.

## Próximas etapas

1. Introduzir RBAC de forma compatível e migrar gradualmente as verificações de cargo para permissões.
2. Padronizar `updated_at` e `deleted_at` nos domínios de conteúdo relevantes.
3. Reconciliar os registros legados órfãos em discussões e respostas antes de adicionar as Foreign Keys de autor.
4. Cobrir Foreign Keys apontadas pelos advisors de performance com índices adequados.
5. Separar progressivamente rotas, serviços e acesso a dados por domínio, evitando uma reescrita total do backend.
6. Criar estratégia formal de Preview/Staging com banco isolado antes de automações que executem migrações em deploy.

# Lorion — Social Product Requirements

Este documento é o contrato de produto da reconstrução social. Uma funcionalidade só pode aparecer na interface quando existir de ponta a ponta: contrato, backend, autorização, persistência, estado de erro e UI.

## Identidade e verificação

- Toda conta nova nasce como usuário comum.
- Perfil pode ter avatar, capa, biografia, interesses e informações declaradas.
- Cargo profissional/acadêmico, especialidade verificada, selo, moderação e status de canal oficial não são concedidos por autodeclaração.
- Apenas administração autorizada pode aprovar/revogar verificações, cargos e canais oficiais.
- O selo precisa ser derivado do estado aprovado no servidor, nunca apenas de texto do perfil.

## Perfil social

- Avatar e capa.
- Biografia.
- Username e nome público.
- Seguidores/seguindo.
- Publicações do autor.
- Projetos públicos do autor.
- Estante de livros do autor conforme privacidade.
- Comunidades das quais participa e/ou nas quais publica, conforme visibilidade.
- Selos/verificações aprovadas.
- Ações de seguir, denunciar, bloquear/silenciar quando implementadas.

## Publicações

- O autor sempre mantém autoria e propriedade do post.
- Um post pode existir no perfil do autor sem comunidade.
- Um post pode ser publicado em uma comunidade sem perder autoria.
- O mesmo post deve aparecer no perfil do autor e no feed da comunidade, sem duplicar o registro de conteúdo.
- A associação com comunidade deve ser relacional (`community_content_links` ou contrato sucessor), não cópia do post.
- Feed geral pode mostrar a comunidade de origem; clicar nela leva à comunidade.
- Feed da comunidade deve mostrar o autor; clicar nele leva ao perfil.
- Via de mão dupla: descobrir perfis pela comunidade e comunidades pelo perfil.
- Curtidas e comentários pertencem ao mesmo conteúdo, independentemente de onde ele seja exibido.

## Composer

O composer de publicação deve permitir apenas opções funcionais, entre elas:

- texto/título quando aplicável;
- mídia quando a infraestrutura de upload estiver disponível;
- comunidade opcional;
- visibilidade dentro das regras permitidas;
- salvar/publicar com estados de carregamento, erro e sucesso.

## Curtidas e comentários

- Uma curtida por usuário/conteúdo.
- Contagem consistente em perfil, feed geral e comunidade.
- Comentários com autoria, data, estado de moderação e respostas quando suportadas.
- Notificações de curtida/comentário respeitando privacidade e bloqueios.
- Backend valida existência e visibilidade do conteúdo antes de aceitar interação.

## Biblioteca

Biblioteca é exclusiva para livros.

- Estante pessoal.
- Quero ler / lendo / lido / abandonado.
- Progresso de leitura.
- Reviews e avaliações.
- Coleções/listas quando implementadas.
- Estante pode aparecer no perfil conforme privacidade.
- Pesquisas, projetos e templates não pertencem à Biblioteca.

## Comunidades

Comunidades são perfis coletivos vivos, não diretórios vazios.

- Avatar/logo.
- Capa.
- Nome, slug, descrição/bio e categoria/área.
- Regras.
- Contagem de membros.
- Entrar/sair/solicitar entrada conforme visibilidade.
- Cargos internos e moderação.
- Feed próprio.
- Discussões.
- Conteúdo fixado/destaques quando implementado.
- Identidade oficial quando aprovada.
- Membros e autores são navegáveis para seus perfis.
- Posts exibidos na comunidade preservam autoria e também aparecem no perfil do autor.
- Perfil do usuário pode mostrar suas comunidades públicas/relevantes.

## Notícias e canais oficiais

- Notícias não são um hub top-level obrigatório; são conteúdo distribuído em Feed/Explorar e possuem rota de detalhe.
- Somente canais/contribuidores aprovados pela administração podem criar/enviar notícias como canal oficial.
- Aprovação de canal é separada de autodeclaração de profissão.
- Administração pode aprovar, suspender e revogar canal oficial.
- Publicação editorial deve manter fontes, status e trilha de moderação/revisão.

## Administração

Administração deve possuir controle real no backend sobre:

- usuários e status de conta;
- solicitações de verificação;
- cargos e permissões;
- selos/especialidades verificadas;
- canais oficiais de notícias;
- notícias e estado editorial;
- comunidades, membros e moderadores;
- denúncias e moderação de conteúdo;
- configurações do site;
- auditoria de ações administrativas.

A UI administrativa nunca substitui autorização no servidor.

## Conteúdo e contas de demonstração

- Perfis seed/fictícios não podem aparecer como pessoas reais.
- Conteúdo fictício que dependa desses perfis deve ser removido ou claramente institucional e pertencente a uma conta real autorizada.
- Seeds não devem recriar contas/personas falsas.

## Templates

A ideia de Templates como produto/superfície foi aposentada.

- Não deve existir rota, nav, feature ativa, seed ou bootstrap de templates.
- Tabelas legadas podem ser removidas em migração segura depois de confirmar ausência de dependências úteis.
- Projetos não devem depender de `template_id` para funcionar.

## Regra de entrega

Não expor funcionalidades incompletas. Cada recurso precisa passar por contrato, persistência, autorização, API, UI, estados de erro/vazio e testes antes de ser liberado.

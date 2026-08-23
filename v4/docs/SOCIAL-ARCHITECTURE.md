# Arquitetura social da v4

A v4 reduz o número de páginas, mas não reduz a capacidade do produto. A regra é manter poucas superfícies de navegação e construir funcionalidades sociais como módulos reutilizáveis.

## Superfícies principais

- Início — feed social e recomendações.
- Explorar — busca, descoberta de pessoas, comunidades, pesquisas e conteúdo.
- Comunidades — espaços sociais organizados por interesse e categoria.
- Biblioteca — exclusiva para livros: estante, leituras, recomendações e reviews.
- Projetos — workspace pessoal de criação e código.
- Perfil — identidade social do usuário.
- Loren — camada assistiva, não uma página isolada obrigatória.

Criar, buscar, seguir, salvar, comentar, compartilhar, bloquear, silenciar e curtir são ações ou features. Elas não ganham páginas principais só porque existem.

## Perfil social

`/perfil/:username` é uma única superfície com módulos internos. Ele deve suportar progressivamente:

- avatar e capa;
- nome, username, bio e identidade acadêmica/técnica;
- seguidores e seguindo;
- botão seguir/deixar de seguir;
- especialidades e selos verificados;
- publicações;
- projetos;
- pesquisas;
- biblioteca pública de livros;
- comunidades;
- atividade recente;
- itens fixados;
- links externos controlados;
- privacidade;
- bloquear e silenciar;
- denunciar;
- reputação/contribuição.

Seguidores e seguindo podem abrir drawer/modal ou rota secundária deep-linkable. Eles não precisam virar itens da navegação principal.

## Biblioteca

Biblioteca não é acervo acadêmico genérico. É uma experiência exclusiva para livros.

Ela deve suportar progressivamente:

- catálogo de livros;
- estante pessoal;
- status `quero ler`, `lendo`, `lido` e `abandonado`;
- progresso de leitura;
- favoritos;
- reviews;
- notas/avaliações;
- recomendações;
- listas/coleções de livros;
- histórico de leitura;
- compartilhamento social de leitura.

Pesquisas não entram na Biblioteca. Elas são conteúdo acadêmico/social acessível por Explorar, Feed, Perfil, Comunidades e páginas de detalhe próprias.

## Grafo social

O domínio social deve ser independente da interface.

Entidades mínimas:

- `user_follows`
- `user_blocks`
- `user_mutes`
- `community_members`

O backend é a autoridade para permissões e visibilidade. O frontend apenas representa o resultado.

## Conteúdo social

A rede precisa tratar conteúdo de forma uniforme mesmo quando a origem é diferente.

Tipos previstos:

- post curto;
- discussão;
- pesquisa;
- projeto;
- tutorial;
- review de livro;
- notícia/editorial;
- atualização de projeto;
- conteúdo de comunidade.

Cada tipo pode manter seu próprio domínio, mas a camada social precisa enxergá-los por um contrato comum para feed, comentários, salvamentos, curtidas, denúncias e notificações.

Contrato social conceitual:

```text
SocialContent
├── id
├── type
├── authorId
├── communityId?
├── title?
├── summary?
├── createdAt
├── updatedAt
├── visibility
├── moderationStatus
└── capabilities
    ├── canComment
    ├── canLike
    ├── canSave
    └── canShare
```

Não duplicar a mesma lógica de curtida/comentário em cada tipo de conteúdo.

## Interações

Features reutilizáveis:

- likes / curtidas;
- comments;
- threaded replies;
- saves/bookmarks;
- internal share;
- mentions;
- reports;
- edit/delete próprio;
- counters derivados;
- optimistic UI com rollback;
- rate limiting no servidor.

## Comentários

O sistema de comentários deve nascer genérico o bastante para funcionar em posts, pesquisas, projetos, reviews e discussões.

Modelo recomendado:

```text
comments
├── id
├── target_type
├── target_id
├── author_id
├── parent_id?
├── body
├── status
├── created_at
├── updated_at
└── deleted_at?
```

Antes de implementar, validar se a integridade referencial exige um registro canônico de conteúdo em vez de referências polimórficas livres.

## Registro canônico de conteúdo

Para evitar que feed, comentários, salvamentos e notificações precisem conhecer todas as tabelas específicas, avaliar uma tabela `content_items` como registro social canônico.

Exemplo:

```text
content_items
├── id
├── type
├── author_id
├── community_id?
├── visibility
├── moderation_status
├── created_at
└── updated_at
```

Tabelas específicas podem referenciar `content_items.id`.

Benefícios:

- comentários com FK real;
- curtidas com FK real;
- saves com FK real;
- denúncias com FK real;
- feed uniforme;
- notificações uniformes;
- contadores consistentes;
- menos `target_type + target_id` sem integridade.

Essa decisão deve ser tomada antes de ampliar comentários/curtidas para todos os domínios.

## Mídia

Mídia não deve ficar embutida em cada feature.

Feature `media` deve cuidar de:

- upload;
- validação MIME/tamanho;
- imagens de post;
- avatar/capa;
- anexos permitidos;
- thumbnails;
- metadados;
- URLs assinadas quando necessário;
- remoção segura;
- moderação.

Nunca confiar somente na extensão enviada pelo navegador.

## Privacidade e segurança social

Preparar desde a base:

- perfil público/privado;
- visibilidade de conteúdo;
- bloquear;
- silenciar;
- limitar interações;
- denúncias;
- moderação;
- rate limiting;
- anti-spam;
- auditoria de ações administrativas;
- proteção contra IDOR/BOLA;
- autorização sempre no backend.

## Notificações

Notificação é uma feature transversal.

Eventos previstos:

- novo seguidor;
- comentário;
- resposta;
- curtida;
- menção;
- convite/comunidade;
- moderação;
- projeto compartilhado;
- atualização relevante.

A UI deve consumir um contrato normalizado e não depender de tabelas específicas de cada domínio.

## Feed

O feed usa sinais, não páginas extras.

Modos iniciais:

- Para você;
- Seguindo;
- Recentes;
- Em alta.

Sinais futuros:

- relacionamento social;
- comunidades em comum;
- interesses;
- conteúdo salvo;
- interação anterior;
- qualidade/reputação;
- recência;
- diversidade;
- segurança/moderação;

O ranking fica em `packages/domain/feed`, nunca dentro de componente React.

## Descoberta

Explorar concentra:

- busca global;
- pessoas;
- comunidades;
- pesquisas;
- conteúdos;
- recomendações;
- tendências;
- categorias.

Evitar páginas principais separadas para cada tipo quando filtro/resultado resolve melhor.

## Mensagens e realtime

Mensagens privadas e presença não são requisito da primeira v4, mas a arquitetura não deve impedir sua entrada.

Quando implementados, devem ser features próprias:

```text
features/messaging
features/presence
features/realtime
```

Não acoplar chat ao perfil ou notificações.

## Loren

Loren deve consumir contratos e tools das features. Ela não pode acessar banco diretamente pelo frontend.

Exemplos de tools futuras:

- pesquisar conteúdo;
- encontrar pessoas/comunidades;
- resumir pesquisa;
- organizar projeto;
- criar rascunho;
- salvar conteúdo;
- preparar publicação;
- consultar notificações.

Ações sensíveis exigem backend, permissão e confirmação apropriada.

## Regra de arquitetura

Antes de criar uma nova página, perguntar:

1. O usuário precisa de um endereço próprio para essa experiência?
2. Há estado/contexto suficiente para justificar uma superfície completa?
3. A função não cabe melhor em modal, drawer, tab interna, filtro ou composer?
4. Ela representa um domínio real ou apenas um nome histórico?
5. Essa página simplifica a navegação ou apenas adiciona outro lugar para manter?

Se a resposta não justificar uma superfície própria, implementar como feature dentro de uma página existente.

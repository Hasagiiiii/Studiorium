# Política de rotas da v4

A v4 não herda aliases históricos. Uma rota só existe quando representa uma superfície atual, necessária e funcional do produto.

## Rotas ativas principais

- `/` — Lorion / feed
- `/explorar` — descoberta + busca global + pessoas, discussões e notícias como filtros
- `/comunidades` — comunidades
- `/biblioteca` — biblioteca exclusiva para livros
- `/projetos` — workspace pessoal de projetos
- `/perfil/:username` — perfil social

## Rotas ativas de detalhe

- `/comunidades/:slug` — comunidade
- `/discussoes/:id` — discussão compartilhável
- `/livros/:id` — livro
- `/pesquisas/:slug` — pesquisa
- `/projetos/:id` — projeto compartilhável
- `/noticias/:slug` — notícia/editorial compartilhável

## Rotas ativas secundárias

- `/notificacoes` — histórico privado de notificações
- `/entrar` — login
- `/cadastro` — cadastro

## Experiências não registradas

Fluxos que ainda não estão completos não ganham rota nem botão ativo. Isso inclui, até terem implementação integral:

- laboratório/editor de código;
- recuperação e redefinição de senha;
- administração v4;
- diretrizes;
- sobre/institucional;
- criação de discussão, review, tutorial e comunidade pela v4.

## Funções que não são páginas

- Busca — vive em `/explorar?q=...` e pode ser acionada por foco/overlay.
- Pessoas — filtro de `/explorar`.
- Criar — launcher do botão `+`; mostra apenas ações realmente implementadas.
- Notícias — aparecem no Feed/Explorar; somente o detalhe possui URL própria.
- Oficina — não existe como superfície independente. Conteúdo técnico pertence às comunidades e categorias.
- Seguidores/seguindo — módulos de perfil, sem hub paralelo.
- Loren — camada assistiva integrada ao app.

## Rotas legadas que não existem na v4

- `/buscar`
- `/pessoas`
- `/criar`
- `/noticias`
- `/oficina`
- `/oficina/*`
- `/tech`
- `/library`
- `/acervo`
- `/templates`
- `/coloquio`
- `/comunidade`
- `/dashboard`
- `/dashboard/publicar`
- `/banner-cientifico`
- `/estudio-templates`
- `/modelos-livres/*`
- `/redacao/*`
- `/escrivaninha`
- `/editor/*`
- `/publicar`
- `/laboratorio/*`
- `/projetos/lab`
- `/projetos/lab/*`

Esses caminhos não ganham páginas ocultas nem aliases silenciosos.

## Regra

Antes de registrar uma rota nova, verificar se a experiência precisa de URL própria e se o fluxo funciona integralmente. Caso contrário, manter a funcionalidade fora da interface ativa ou usar uma feature embutida quando ela estiver pronta.

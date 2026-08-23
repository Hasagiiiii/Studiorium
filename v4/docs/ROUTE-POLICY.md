# Política de rotas da v4

A v4 não herda aliases históricos automaticamente. Uma rota só existe quando representa uma superfície atual e necessária do produto.

## Rotas principais

- `/` — Lorion / feed
- `/explorar` — descoberta + busca global + pessoas + notícias como filtro
- `/comunidades` — comunidades
- `/biblioteca` — biblioteca
- `/projetos` — workspace pessoal de projetos
- `/perfil/:username` — perfil social

## Rotas de detalhe

- `/comunidades/:slug` — comunidade
- `/comunidades/:slug/discussoes/:id` — discussão em comunidade
- `/livros/:id` — livro
- `/pesquisas/:slug` — pesquisa
- `/projetos/:id` — projeto compartilhável
- `/projetos/lab/:id` — projeto de código
- `/noticias/:slug` — notícia/editorial compartilhável

## Rotas secundárias

- `/projetos/lab` — laboratório de código
- `/notificacoes` — histórico completo de notificações
- `/entrar` — login
- `/cadastro` — cadastro
- `/recuperar-senha` — recuperação
- `/redefinir-senha` — redefinição
- `/admin/*` — administração
- `/diretrizes` — diretrizes
- `/sobre` — sobre

## Funções que não são páginas

- Busca — vive em `/explorar?q=...` e pode ser acionada por overlay/command.
- Pessoas — filtro de `/explorar`.
- Criar — launcher/composer do botão `+`.
- Notícias — aparecem no Feed/Explorar; somente o detalhe possui URL própria.
- Oficina — não existe como superfície independente. Conteúdo técnico pertence às comunidades e categorias.
- Seguidores/seguindo — módulos do perfil, drawer/modal ou rota secundária apenas quando deep-link justificar.
- Loren — camada assistiva integrada ao app; não precisa ser uma aba isolada.

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

Esses caminhos não ganham páginas ocultas nem aliases silenciosos. Qualquer redirect temporário de migração precisa ser documentado individualmente e possuir data de remoção.

## Regra

Antes de registrar uma rota nova, verificar se a experiência realmente precisa de URL própria. Caso contrário, usar feature embutida: modal, drawer, filtro, composer, tab interna, popover ou seção.

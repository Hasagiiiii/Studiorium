# Política de rotas da v4

A v4 não herda aliases históricos automaticamente. Uma rota só existe quando representa uma área atual do produto.

## Rotas canônicas

- `/` — Lorion / feed
- `/explorar` — descoberta
- `/buscar` — busca global
- `/criar` — launcher de criação
- `/pessoas` — descoberta de pessoas
- `/perfil/:username` — perfil
- `/comunidades` — comunidades
- `/comunidades/:slug` — comunidade
- `/comunidades/:slug/discussoes/:id` — discussão em comunidade
- `/biblioteca` — biblioteca
- `/livros/:id` — livro
- `/pesquisas/:slug` — pesquisa
- `/projetos` — projetos
- `/projetos/:id` — projeto
- `/projetos/lab` — laboratório de código
- `/projetos/lab/:id` — projeto de código
- `/oficina` — Oficina
- `/oficina/:slug` — conteúdo da Oficina
- `/noticias` — notícias
- `/noticias/:slug` — notícia
- `/notificacoes` — notificações
- `/entrar` — login
- `/cadastro` — cadastro
- `/recuperar-senha` — recuperação
- `/redefinir-senha` — redefinição
- `/admin/*` — administração
- `/diretrizes` — diretrizes
- `/sobre` — sobre

## Rotas legadas que não existem na v4

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

Esses caminhos não ganham páginas ocultas nem aliases silenciosos. Durante a migração, qualquer redirect necessário precisa ser documentado individualmente e possuir data para remoção.

## Nomenclatura

A interface usa **Oficina**. O rótulo histórico `Officina Technica` não faz parte da v4.

O laboratório de código pertence a **Projetos** e usa `/projetos/lab`.

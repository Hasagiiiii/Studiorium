# Auditoria de páginas da v4

Objetivo: manter apenas superfícies que possuem função própria. Funcionalidade não é sinônimo de página.

## Páginas principais — ficam

### `/` — Início
Função própria: feed social, recomendações, atualizações e relações.

### `/explorar` — Explorar
Função própria: descoberta global.
Absorve busca, pessoas, notícias como listagem, tendências e filtros.

### `/comunidades` — Comunidades
Função própria: descoberta e gestão de espaços sociais.
Categorias como Tecnologia, Jogos, Hardware, Ciência e Literatura são filtros/classificações, não páginas principais independentes.

### `/biblioteca` — Biblioteca
Função própria: livros, pesquisas, reviews, acervo e coleção pessoal.
A descoberta geral também pode aparecer em Explorar, mas Biblioteca mantém experiência e ferramentas próprias de conhecimento salvo/curado.

### `/projetos` — Projetos
Função própria: workspace pessoal de criação, edição e organização.
Não deve duplicar Explorar mostrando catálogo geral de projetos de terceiros.

## Identidade — fica como superfície própria

### `/perfil/:username`
Função própria: identidade social e portfólio vivo.
Seguidores, seguindo, publicações, pesquisas, projetos, biblioteca, comunidades e atividade aparecem como módulos/tabs internos.

## Páginas de detalhe — ficam

Detalhes precisam de URL compartilhável, histórico e deep-link.

- `/comunidades/:slug`
- `/comunidades/:slug/discussoes/:id`
- `/livros/:id`
- `/pesquisas/:slug`
- `/projetos/:id`
- `/projetos/lab/:id`
- `/noticias/:slug`

## Ferramentas secundárias — ficam quando há fluxo próprio

### `/projetos/lab`
É ferramenta/workspace, não aba principal.

### `/notificacoes`
Pode existir como histórico completo e deep-link, mesmo que o uso normal aconteça em popover/drawer.

### autenticação
- `/entrar`
- `/cadastro`
- `/recuperar-senha`
- `/redefinir-senha`

São fluxos necessários, não itens da navegação principal.

### administração
- `/admin/*`

É aplicação operacional por permissão, isolada da navegação social comum.

### institucional
- `/diretrizes`
- `/sobre`

Ficam fora da navegação principal e podem ser acessadas por footer/configurações.

## Deixam de ser páginas

### `/buscar`
REMOVER.
Busca vive em `/explorar?q=...` e pode abrir também como command/search overlay.

### `/pessoas`
REMOVER.
Pessoas são um filtro de Explorar.

### `/criar`
REMOVER.
Criar é launcher/composer acionado pelo botão `+`.

### `/noticias`
REMOVER como hub principal.
Notícias são tipo de conteúdo no Feed/Explorar. `/noticias/:slug` permanece para detalhe compartilhável.

### `/oficina` e `/oficina/:slug`
REMOVER.
Tecnologia/Hardware/Jogos/Carros/Motos são categorias de comunidades/conteúdos. Tutoriais entram em comunidades.

## Legado explicitamente morto

Não recriar aliases ou telas para:

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

## Regra para novas páginas

Uma feature só ganha página própria quando precisa de pelo menos um destes fatores:

- URL compartilhável/deep-link;
- histórico/navegação própria;
- fluxo longo ou workspace;
- contexto persistente próprio;
- necessidade de retorno direto por notificação/link externo.

Caso contrário, preferir:

- modal;
- drawer;
- popover;
- composer;
- tab interna;
- filtro;
- seção;
- action sheet;
- command palette.

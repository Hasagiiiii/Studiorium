# Auditoria de páginas da v4

Objetivo: manter apenas superfícies que possuem função própria e fluxo funcional. Funcionalidade não é sinônimo de página.

## Páginas principais ativas

### `/` — Início

Feed social e descoberta por relevância, relações, recência e tendência.

### `/explorar` — Explorar

Descoberta global. Absorve busca, pessoas, notícias, pesquisas, projetos, discussões e filtros.

### `/comunidades` — Comunidades

Descoberta de espaços sociais. Tecnologia, Jogos, Hardware, Ciência, Literatura e outras áreas são categorias/classificações, não páginas principais independentes.

### `/biblioteca` — Biblioteca

Experiência exclusiva de livros. A superfície ativa apresenta livros e seus detalhes. Recursos sociais de leitura só entram quando seus fluxos próprios estiverem completos. Pesquisas não pertencem à Biblioteca.

### `/projetos` — Projetos

Workspace pessoal com criação e organização dos projetos que já são suportados pela API v4. Não duplica Explorar com um catálogo geral de terceiros.

## Identidade

### `/perfil/:username`

Identidade social. Somente informações e ações já suportadas pelo grafo social ficam ativas; novos módulos entram gradualmente sem criar hubs redundantes.

## Páginas de detalhe ativas

- `/comunidades/:slug`
- `/discussoes/:id`
- `/livros/:id`
- `/pesquisas/:slug`
- `/projetos/:id`
- `/noticias/:slug`

## Rotas secundárias ativas

### `/notificacoes`

Histórico privado de notificações, com leitura individual e em lote.

### autenticação

- `/entrar`
- `/cadastro`

Recuperação de senha só será registrada quando o fluxo transacional estiver completo.

## Capacidades planejadas, sem rota ativa

- laboratório/editor de código;
- administração v4;
- páginas institucionais;
- criação de discussão, review, tutorial ou comunidade;
- módulos de leitura que dependam de persistência ainda não portada.

## Deixam de ser páginas

### `/buscar`

Busca vive em `/explorar?q=...`.

### `/pessoas`

Pessoas são filtro de Explorar.

### `/criar`

Criar é launcher acionado pelo botão `+` e só oferece ações implementadas.

### `/noticias`

Notícias são tipo de conteúdo no Feed/Explorar. `/noticias/:slug` permanece para detalhe compartilhável.

### `/oficina` e `/oficina/:slug`

Tecnologia, Hardware, Jogos, Carros e Motos são categorias de comunidades/conteúdos, não uma aplicação paralela.

## Legado morto

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
- `/projetos/lab`
- `/projetos/lab/*`

## Regra para novas páginas

Uma feature só ganha página própria quando o fluxo está implementado e precisa de pelo menos um destes fatores:

- URL compartilhável/deep-link;
- histórico/navegação própria;
- fluxo longo ou workspace;
- contexto persistente próprio;
- retorno direto por notificação/link externo.

Caso contrário, usar uma feature embutida quando ela estiver pronta: modal, drawer, popover, composer, tab interna, filtro, seção, action sheet ou command palette.

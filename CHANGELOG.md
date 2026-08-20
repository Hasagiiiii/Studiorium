# Changelog do Studiorium

Este arquivo reúne o histórico técnico que antes ficava espalhado em vários `CHANGELOG-v*.md`.
As migrações de banco continuam versionadas separadamente em `supabase/upgrade-*.sql`.

## 3.4.0 — Fundação de Comunidades

- transforma Comunidades na camada principal de organização por assunto;
- mantém o Colóquio como espaço de conversas dentro de cada comunidade e preserva links antigos;
- cria 15 comunidades oficiais iniciais nas áreas de tecnologia, automotivo, academia, criação e
  leitura;
- separa participação voluntária de sanções locais para impedir reentrada que contorne moderação;
- introduz papéis locais de Membro, Curador, Moderador e Líder sem conceder poderes globais de ADM;
- permite que Líderes administrem funções e regras somente da própria comunidade;
- permite moderação local de membros e conteúdos, sem apagar o conteúdo da plataforma;
- liga discussões e materiais da Oficina às comunidades por relacionamento, sem duplicar registros;
- exige participação ativa e liberada para criar, responder ou editar conteúdo comunitário;
- estabelece uma comunidade principal por conteúdo nesta primeira versão;
- adiciona catálogo, busca, filtros, páginas internas e gestão responsiva de Comunidades;
- adiciona a migração `supabase/upgrade-v3.4-communities.sql`, com RLS e acesso apenas pela API;
- amplia testes de regressão para permissões, vínculos, navegação, moderação e responsividade.

## 3.3.1 — Consolidação e manutenção

- sincroniza `package.json` e `package-lock.json` na versão 3.3.1;
- atualiza `@supabase/supabase-js` de 2.57.0 para 2.112.3;
- remove a cadeia legada de `@supabase/node-fetch` do lockfile;
- torna `npm run check` somente leitura com `prettier --check`;
- adiciona validações contra divergência de versão e imports CSS duplicados;
- separa falhas 5xx de respostas esperadas 4xx nos logs da API;
- inicia a consolidação dos módulos de runtime removendo sufixos de versão dos recursos mais recentes;
- organiza a ordem dos imports CSS por responsabilidade sem alterar o hardening responsivo final;
- mantém migrações anteriores como histórico, sem carregá-las no runtime.

## 3.2.8 — Robustez responsiva

- reforça comportamento em larguras de 380 px e 330 px;
- compacta a navbar sem remover notificações, login/perfil ou menu;
- impede etiquetas, badges e metadados longos de criarem overflow horizontal;
- mantém títulos fluidos e legíveis em telas muito estreitas;
- adiciona testes de regressão para os extremos de viewport.

## 3.2.4 — Layout responsivo

Reorganização da responsividade para impedir sobreposição, compressão excessiva, quebra vertical de textos e overflow horizontal.

- revisão de desktop amplo, notebooks, tablets, celulares, orientação paisagem, touch e impressão;
- revisão de navbar, grids, Bibliotheca, formulários, editores, notícias, templates, laboratório, ADM, Colloquium, notificações e pôster;
- `min-width: 0` aplicado onde necessário em grids e flexboxes;
- mídia e controles limitados ao contêiner;
- rolagem horizontal restrita às áreas que realmente precisam dela;
- layouts de múltiplas colunas passam a reduzir progressivamente antes do celular.

## 3.2.3 — Navegação

- impede quebra vertical do logotipo Studiorium e do nome do usuário;
- preserva em uma linha os nomes acadêmicos da navegação em desktop;
- amplia a largura útil da barra superior sem alterar a largura do conteúdo das páginas;
- compacta tipografia e espaçamento entre 1121 px e 1320 px;
- abaixo de 1120 px, usa o menu responsivo existente;
- no celular, reduz selo e tipografia e mantém os controles acessíveis.

## 3.2 — Armarium Librorum

### Estante comunitária

- remove os seis livros de demonstração da versão 3.1;
- o catálogo passa a nascer de leituras reais adicionadas por membros autenticados;
- cada novo livro exige nota e review do primeiro leitor;
- usuários podem marcar livros como **Quero ler**, **Lendo** ou **Lido**;
- reviews posteriores recalculam média, número de avaliações e recomendações;
- a Escrivaninha continua exibindo somente os livros guardados pelo próprio usuário.

### Capas, compra e segurança

- ISBN pode gerar capa através do Open Library;
- também é possível informar URL HTTPS de capa e link HTTPS de edição ou compra;
- links comerciais usam `nofollow sponsored`;
- título, autor, descrição e review passam pela moderação local;
- autoria de reviews é resolvida pelo backend;
- `book_reviews` usa RLS e o navegador continua acessando o banco por meio da API do Studiorium.

### Identidade visual

- Biblioteca → **Bibliotheca**;
- Colóquio → **Colloquium**;
- Escrivaninha → **Scriptorium**;
- Oficina → **Officina**;
- Laboratório → **Laboratorium**;
- Notícias → **Nuntii**;
- Redação → **Redactio**;
- Acervo → **Tabularium**;
- Autores → **Auctores**.

## 3.1 — Comunidade verificada

### Identidade acadêmica

- novos tipos de perfil, incluindo monitor, técnico, profissional, autodidata e internauta;
- campos de curso, instituição e nível de formação;
- solicitação de verificação com análise administrativa;
- selos públicos de especialista e colaborador ativo.

### Equipe, descoberta e segurança

- cargos de moderador, curador, editor e administrador;
- painel para revisar comprovações de formação;
- estante visual de livros no catálogo e estante pessoal na Escrivaninha;
- pesquisa pública de usuários por formação e especialidade;
- impulso único por usuário para publicações aprovadas;
- central interna de notificações responsiva;
- migração `supabase/upgrade-v3.1-community-identity.sql`;
- RLS e revogação de acesso direto nas novas tabelas;
- triagem local de risco com revisão humana;
- projetos acadêmicos privados por padrão, com compartilhamento opcional.

## 2.7.0 — Estrutura, segurança e manutenção

- eventos da interface separados por navegação, projetos, comunidade, filtros, conta e ADM;
- Prettier fixado no projeto e limite automático de 140 caracteres por linha;
- validação recursiva de módulos, scripts, testes e SQL operacional;
- JSON inválido retorna HTTP 400;
- uploads validam Base64, MIME, extensão e assinatura do conteúdo;
- migração v2.7 corrige a coluna legada `event_type` sem perder eventos anteriores;
- schema consolidado inclui rate limit, eventos de segurança, índices e revogação de acesso direto;
- provisionamento administrativo explícito.

## 2.3 — Tech & Oficina + Lab

- nova área Tech & Oficina: Tecnologia, Jogos, PC & Hardware, Carros e Motos;
- publicações comunitárias com tutoriais, projetos, solução de problemas e guias;
- Studiorium Lab para criar e salvar projetos HTML/CSS/JavaScript;
- prévia isolada em iframe sandbox;
- projetos de código privados ou públicos integrados à Escrivaninha;
- migração `supabase/upgrade-v2.3-tech-lab.sql`.

## 2.2 — Painel ADM

- painel `/admin` com visão geral e indicadores;
- moderação de denúncias com ações reversíveis;
- gestão de usuários e sessões;
- gestão de publicações, Colóquio e Acervo;
- configurações armazenadas no banco;
- registro administrativo em `admin_audit_log`;
- migração `upgrade-v2.2-admin.sql` para atualizar a base sem excluir dados.

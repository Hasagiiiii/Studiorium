# Arquitetura do Studiorium

O Studiorium separa código por responsabilidade para reduzir regressões e facilitar colaboração.

## Interface

### CSS

- `public/css/responsive/`: regras de viewport, navegação adaptativa, mobile, títulos e hardening.
- `public/css/animations/`: transições, diálogos, feedback visual e política de movimento.
- `public/css/`: estilos-base e módulos de recursos que ainda estão sendo consolidados.
- `public/style.css`: apenas ordena a cascata. Não deve concentrar regras de componentes.

A ordem de `public/style.css` é parte da arquitetura. `responsive/hardening.css` deve ser sempre a última camada.

### JavaScript

- `public/js/views/`: somente renderização das páginas e componentes de página.
- `public/js/events/`: eventos e ações disparadas pelo usuário.
- `public/js/animations/`: comportamento de movimento e preferências de acessibilidade.
- `public/js/runtime.js`: estado, cliente HTTP e utilidades fundamentais do navegador.
- `public/js/router.js`: resolução das rotas da SPA.
- módulos de recurso na raiz de `public/js/` devem ser movidos gradualmente para pastas de domínio quando isso não exigir uma migração arriscada.

## Servidor

- `src/server/routes/`: regras de domínio e operações da API.
- `src/server/router.js`: apenas despacho HTTP; novas regras de negócio não devem nascer aqui.
- `src/server/auth.js`, `security.js`, `http.js` e `db.js`: infraestrutura compartilhada.

Leitura pública e operações do proprietário devem ser diferenciadas pela autorização, não pelo acaso de um objeto já ter vindo no bootstrap.
Conteúdo privado nunca pode se tornar público apenas porque o usuário não está autenticado.

## Comunidades

Comunidades são uma camada de organização e permissão, não um segundo sistema de publicações.
Discussões continuam em `discussions`, materiais práticos continuam em `tech_resources` e os demais domínios mantêm suas tabelas próprias.

- `communities`: identidade, área, regras locais e estado da comunidade.
- `community_members`: participação e papel local do usuário.
- `community_content_links`: relação entre uma comunidade e um conteúdo já existente.
- `src/server/community-links.js`: resolução e vínculo entre conteúdos e comunidade.
- `src/server/community-permissions.js`: papéis e permissões locais.
- `src/server/routes/communities.js`: descoberta, participação, liderança, regras e moderação local.

A versão 3.4 trabalha com uma comunidade principal por conteúdo. Essa restrição é garantida também no banco para que a API não dependa apenas de convenção.

Participação voluntária e sanções não são o mesmo estado. `status` registra se a pessoa participa ou saiu; `moderation_status` registra se está liberada, silenciada ou removida pela moderação. Um usuário silenciado ou removido não recebe a permissão `participate`.

A hierarquia local é `member`, `curator`, `moderator` e `leader`. O administrador do Studiorium permanece acima da hierarquia local. Líderes podem administrar funções de confiança e regras da própria comunidade, mas não transformam a função local em poder global.

Colóquio é a área de conversa de cada comunidade. A rota antiga `/coloquio` existe somente para compatibilidade; a navegação principal aponta para `/comunidades`.

Oficina permanece um domínio próprio. Um tutorial ou projeto pode ser ligado a uma comunidade por `community_content_links` e continua existindo apenas uma vez na plataforma.

## Responsividade

O layout deve funcionar por reflow real, sem `zoom:` ou `transform: scale()` para consertar viewport.
As faixas atuais cobrem desktop, notebook, tablet, celular, telas abaixo de 380/330 px, landscape baixo e dispositivos touch.

## Regras para novas mudanças

1. Um arquivo deve ter uma responsabilidade principal clara.
2. Não criar sufixos de versão em novos arquivos de runtime.
3. Não adicionar correções globais em um módulo de recurso local.
4. Não duplicar regras para resolver um problema que pertence a `responsive/`.
5. Alterações de movimento devem respeitar `prefers-reduced-motion`.
6. Rotas públicas devem validar explicitamente o estado público do recurso.
7. Mudanças estruturais precisam manter `npm run check` e `npm test` verdes antes de integração.
8. Novos tipos de conteúdo comunitário devem reutilizar `community_content_links` em vez de criar tabelas de posts paralelas.
9. Permissões locais devem ser verificadas no servidor; esconder um botão na interface nunca substitui autorização da API.

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

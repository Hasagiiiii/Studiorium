# Responsabilidades por pasta

A v4 usa isolamento por responsabilidade como regra obrigatória.

## apps/web

Interface do usuário.

- `app/`: bootstrap, router, estado global mínimo e App Shell.
- `components/ui/`: componentes visuais genéricos.
- `components/navigation/`: navegação.
- `components/feedback/`: loading, empty, error, toast, skeleton.
- `features/`: uma pasta por domínio do produto.
- `styles/`: tokens, base, componentes, features e motion.

## apps/api

Backend HTTP.

- `core/`: router, resposta, erros.
- `middleware/`: sessão, origem, rate limit, autorização.
- `features/`: endpoints separados por domínio.

## packages/contracts

Schemas runtime e tipos públicos. Não depende de UI, HTTP ou banco.

## packages/api-client

Chamadas HTTP tipadas. O navegador não chama Supabase diretamente.

## packages/domain

Regras puras de negócio. Não usa DOM, fetch ou Supabase.

## packages/database

Tipos do schema, repositories e migrations. Não renderiza UI.

## tests

Separado em `contracts`, `domain`, `api`, `web` e `integration`.

## Diagnóstico

- formato dos dados -> `contracts`
- regra de negócio -> `domain`
- banco -> `database/repositories`
- HTTP/autorização -> `apps/api`
- chamada do navegador -> `api-client`
- estado/render -> `apps/web/features`
- visual -> `styles/features`
- animação -> `styles/motion`

É proibido concentrar várias features em arquivos genéricos como `events.js`, `views.js`, `utils.js` ou equivalentes gigantes.

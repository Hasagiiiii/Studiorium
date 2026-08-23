# Lorion / Studiorium v4

Esta árvore é a reconstrução limpa do projeto inteiro.

A v4 não importa o frontend legado nem depende do `bootstrap` antigo. A aplicação atual permanece em produção como fallback até a substituição controlada.

## Objetivo

Reconstruir o Studiorium como ecossistema e o Lorion como rede social de conhecimento sobre contratos explícitos, validação runtime, serviços por feature, autorização no servidor e UI app-first.

## O que é preservado

- dados existentes no Supabase que ainda representam o produto atual;
- autenticação e sessões compatíveis;
- comunidades, perfis, livros, projetos, pesquisas e notícias com valor de produto;
- grafo social `user_follows`;
- notificações;
- regras de segurança comprovadas;
- linguagem visual e motion aprovada para o produto.

Conteúdos técnicos úteis do legado podem ser migrados para comunidades por categoria. A antiga Oficina, seus aliases e catálogos de templates não são superfícies da v4.

## O que não é carregado automaticamente

- estado global implícito do frontend legado;
- respostas de API sem contrato;
- views que tratam estruturas opcionais como obrigatórias;
- seletores CSS compartilhados entre features sem intenção;
- handlers globais que concentram regras de negócio;
- rotas duplicadas e aliases históricos;
- módulos mortos, telas substituídas ou funcionalidades pela metade;
- duplicação de catálogos e hubs.

## Arquitetura

```text
v4/
├── apps/
│   ├── web/                 # App Shell e interface
│   └── api/                 # API e autorização
├── packages/
│   ├── contracts/           # contratos + validação runtime
│   ├── domain/              # regras puras
│   ├── api-client/          # comunicação HTTP tipada
│   └── database/            # acesso server-side ao Supabase
└── docs/                    # decisões de arquitetura e produto
```

## Superfícies principais

- Início;
- Explorar;
- Comunidades;
- Biblioteca, exclusiva para livros;
- Projetos;
- Perfil.

Busca vive em Explorar. Criar é uma ação. Notícias são conteúdo. Tecnologia, jogos, hardware, carros, motos e assuntos semelhantes são categorias de comunidades, não hubs paralelos.

## Interação e motion

A fundação de interação usa `motion/react` somente onde o movimento explica estado ou contexto. Já fazem parte da v4:

- skeleton shimmer com fallback para `prefers-reduced-motion`;
- carregamento progressivo do feed com `IntersectionObserver` e botão manual de fallback;
- pilha de toasts para feedback de ações;
- botão `+` com resposta de estado;
- launcher de criação como painel no desktop e sheet arrastável no mobile;
- header móvel que se recolhe ao descer e reaparece ao subir ou receber foco.

Esses comportamentos são componentes da própria v4 e não reutilizam código dos exemplos usados como referência.

## Regra de entrega

A v4 só registra e exibe um fluxo quando ele funciona de ponta a ponta. Funcionalidades futuras permanecem fora das rotas e dos controles ativos até possuírem contrato, API, autorização quando necessária, interface, estados de carregamento/erro/vazio e validação automatizada.

A validação oficial usa Node 24 e executa typecheck, testes e build real do frontend. O deploy também executa um smoke gate que confirma os artefatos gerados, as variáveis server-side do Supabase e o acesso às tabelas essenciais antes de a Vercel aceitar o preview.

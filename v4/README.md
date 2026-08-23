# Lorion / Studiorium v4

Esta árvore é a reconstrução limpa do projeto inteiro.

A v4 não importa o frontend legado nem depende do `bootstrap` antigo. O código atual permanece em produção apenas como fallback até a paridade funcional.

## Objetivo

Reconstruir o Studiorium como ecossistema e o Lorion como rede social de conhecimento sobre contratos explícitos, validação runtime, serviços por feature, autorização no servidor e UI app-first.

## O que é preservado

- dados existentes no Supabase que ainda representam o produto atual;
- autenticação/sessões enquanto a migração de identidade não for aprovada;
- RBAC e auditoria;
- comunidades, perfis, livros, projetos, pesquisas e notícias com valor de produto;
- grafo social `user_follows`;
- notificações;
- regras de segurança comprovadas;
- linguagem visual e motion que passaram pela revisão do produto.

Conteúdos técnicos úteis do legado podem ser migrados para comunidades por categoria. A antiga Oficina, seus aliases e catálogos de templates não são superfícies da v4.

## O que não é carregado automaticamente

- estado global implícito do frontend legado;
- respostas de API sem contrato;
- views que acessam estruturas opcionais como se sempre existissem;
- seletores CSS compartilhados entre features sem intenção;
- handlers globais que concentram regras de negócio;
- rotas duplicadas e aliases históricos sem necessidade;
- módulos mortos ou telas substituídas;
- duplicação de catálogos e hubs;
- páginas antigas preservadas apenas por compatibilidade histórica.

## Arquitetura alvo

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

Busca vive em Explorar. Criar é uma ação/composer. Notícias são conteúdo. Tecnologia, jogos, hardware, carros, motos e assuntos semelhantes são categorias de comunidades, não hubs paralelos.

## Ordem de migração

1. fundação e contratos;
2. autenticação e identidade;
3. App Shell;
4. perfis + grafo social;
5. feed e publicação social;
6. comunidades e categorias;
7. biblioteca e livros;
8. projetos + laboratório;
9. pesquisas;
10. notícias/editorial;
11. notificações, busca global e moderação;
12. administração;
13. motion e identidade visual;
14. PWA;
15. Loren.

A validação oficial da v4 usa Node 24. Nenhuma área é considerada migrada até possuir contrato, validação, estados de erro/vazio/carregamento, autorização e testes.

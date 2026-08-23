# Lorion / Studiorium v4

Esta árvore é a reconstrução limpa do projeto inteiro.

A v4 não importa o frontend legado nem depende do `bootstrap` antigo. O código atual permanece em produção apenas como fallback até a paridade funcional.

## Objetivo

Reconstruir o Studiorium como ecossistema e o Lorion como rede social de conhecimento sobre contratos explícitos, validação runtime, serviços por feature, autorização no servidor e UI app-first.

## O que é preservado

- dados existentes no Supabase;
- autenticação/sessões enquanto a migração de identidade não for aprovada;
- RBAC e auditoria;
- comunidades, perfis, biblioteca, projetos, pesquisas, notícias, Oficina e templates que tenham valor de produto;
- grafo social `user_follows`;
- notificações;
- regras de segurança comprovadas;
- linguagem visual e motion que passaram pela revisão do produto.

## O que não é carregado automaticamente

- estado global implícito do frontend legado;
- respostas de API sem contrato;
- views que acessam estruturas opcionais como se sempre existissem;
- seletores CSS compartilhados entre features sem intenção;
- handlers globais que concentram regras de negócio;
- rotas duplicadas e aliases históricos sem necessidade;
- módulos mortos ou telas substituídas;
- duplicação de catálogos e hubs.

## Arquitetura alvo

```text
v4/
├── apps/
│   └── web/                 # App Shell e interface
├── packages/
│   ├── contracts/           # contratos + validação runtime
│   ├── domain/              # regras puras
│   ├── api-client/          # comunicação HTTP tipada
│   └── database/            # tipos do schema e acesso server-side
└── tests/                   # contratos e comportamento
```

## Ordem de migração

1. fundação e contratos;
2. autenticação e identidade;
3. App Shell;
4. perfis + grafo social;
5. feed e publicação social;
6. comunidades;
7. biblioteca e livros;
8. projetos + laboratório;
9. pesquisas;
10. Oficina;
11. notícias/editorial;
12. notificações, busca global e moderação;
13. administração;
14. motion e identidade visual;
15. PWA;
16. Loren.

Nenhuma área é considerada migrada até possuir contrato, validação, estados de erro/vazio/carregamento, autorização e testes.
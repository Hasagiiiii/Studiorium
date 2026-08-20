# Manutenção do Studiorium

Este documento define regras para evitar conflito entre versões e acúmulo de camadas temporárias.

## Versão oficial

A versão oficial deve permanecer idêntica em `package.json` e `package-lock.json`.
O script `npm run check` valida essa consistência automaticamente.

## Arquivos de runtime

Novos arquivos carregados pelo navegador ou pela API devem usar nomes estáveis por responsabilidade, por exemplo:

- `book-catalog.js`;
- `admin-published-actions.js`;
- `views/books.js`;
- `book-catalog.css`.

Evite criar novos nomes com sufixos como `-v329`, `-v330` ou `-v331`. A evolução do código deve ser rastreada pelo Git e pelo changelog.
Arquivos versionados antigos podem ser consolidados gradualmente quando houver cobertura de testes suficiente.

## CSS

`public/style.css` é o índice oficial das folhas de estilo.

- não repetir imports;
- agrupar base, estrutura e recursos por responsabilidade;
- manter `layout-hardening-v328.css` como última camada enquanto a consolidação responsiva não estiver concluída;
- não usar `zoom` ou `transform: scale()` como atalho para corrigir responsividade.

## Dependências

Dependências devem permanecer fixadas em versões explícitas e acompanhadas de `package-lock.json`.
Não atualizar apenas `package.json`.

## Branches

Branches de correções já integradas à `main` devem ser removidas depois de confirmado que não contêm commits exclusivos.
Branches de trabalho ainda não integradas devem permanecer até revisão ou descarte consciente.

## Banco de dados

Arquivos `supabase/upgrade-*.sql` são histórico de migração e não são código de runtime.
Não remover migrações antigas apenas por causa do número da versão.

## Antes de integrar na main

1. Executar `npm ci`.
2. Executar `npm run check`.
3. Executar `npm test`.
4. Confirmar que o preview da Vercel está `READY`.
5. Revisar erros 5xx no ambiente de preview ou produção.

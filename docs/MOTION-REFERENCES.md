# Estratégia de motion do Studiorium

As referências visuais reunidas para a evolução da interface apontam para cinco frentes diferentes. A implementação deve absorver capacidades, não copiar identidades visuais.

- **Anime.js:** indicado para sequências narrativas, SVG, timelines e transformações especiais, como pergaminhos e selos.
- **Motion:** referência principal para hover, drag, gestos e transições de layout.
- **Kokonut UI:** referência de composição para componentes ricos e microinterações prontas, adaptadas ao design system próprio.
- **bklit UI:** referência para visualização de dados e gráficos editoriais.
- **Manus:** referência de acabamento, direção de arte e transições de qualidade de estúdio.

## Primeira implementação

A primeira experiência é a transição de pergaminho para conteúdos editoriais. Links internos de pesquisas e projetos continuam navegando na mesma aba e passam por uma abertura visual curta antes de renderizar o detalhe. A implementação usa Web Animations API e CSS próprios nesta primeira etapa, evitando adicionar uma dependência antes de existir uma etapa de bundle frontend dedicada.

A experiência respeita `prefers-reduced-motion`, não intercepta cliques modificados (Ctrl/Cmd/Shift/Alt), não interfere em downloads e mantém a navegação padrão como fallback.

## Próximos usos recomendados

1. Transições de layout e reorganização de filtros inspiradas em Motion.
2. Timelines narrativas e SVG com Anime.js após definir carregamento versionado/empacotado.
3. Gráficos animados no Pulso da Comunidade inspirados em bklit UI.
4. Componentes sociais com estados e microinterações inspirados em Kokonut UI.
5. Transições compartilhadas entre card e detalhe para aproximar a experiência de um aplicativo nativo.

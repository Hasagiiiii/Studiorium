# Studiorium 3.2.4 — layout responsivo

## Objetivo

Reorganizar a responsividade do Studiorium para impedir sobreposição, compressão excessiva, quebra vertical de textos e overflow horizontal em diferentes tamanhos de tela.

## Estrutura

- `responsive.css` passa a concentrar a coordenação global de breakpoints e é importado por último.
- estilos-base do painel administrativo foram movidos para `admin-tech.css`.
- regras internas específicas continuam próximas de seus componentes, enquanto a camada global define limites seguros de largura e transições entre layouts.

## Faixas tratadas

- desktop amplo;
- notebooks e desktops compactos;
- tablets em orientação horizontal e vertical;
- celulares grandes;
- celulares pequenos até 380 px;
- celulares em orientação paisagem;
- dispositivos de toque/coarse pointer;
- impressão.

## Áreas revisadas

- navbar e identidade acadêmica;
- hero, títulos e seções;
- grids de cards e estatísticas;
- Bibliotheca, filtros, estante e Armarium Librorum;
- formulários, toolbars e ações;
- editor de documentos e painéis laterais;
- notícias, redação e artigos;
- estúdio de templates e pré-visualizações;
- laboratório de código e iframes;
- painel administrativo e tabelas;
- Colloquium, comentários e discussões relacionadas;
- notificações e toasts;
- rodapé;
- preview de pôster e áreas com rolagem interna controlada.

## Proteções

- elementos de grid/flex recebem `min-width: 0` onde necessário;
- mídia e controles não podem ultrapassar o contêiner;
- rolagem horizontal fica restrita a áreas que realmente precisam dela, como tabelas e previews;
- o documento principal não ganha overflow horizontal por causa de um componente;
- botões e controles recebem área de toque adequada em dispositivos touch;
- layouts de múltiplas colunas reduzem progressivamente antes de chegar ao celular.

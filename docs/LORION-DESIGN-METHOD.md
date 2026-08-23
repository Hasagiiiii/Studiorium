# Lorion Design Method

## Objetivo

Este documento define um método próprio para projetar interfaces do Lorion. Ele nasce do estudo de boas práticas de design de produto, design editorial, redes sociais, acessibilidade e interfaces digitais, mas não depende de uma skill, framework visual ou fornecedor específico.

A regra central é simples:

> Se uma tela pudesse pertencer a uma fintech, CRM ou loja apenas trocando o logotipo e os textos, ela ainda não tem identidade suficiente para o Lorion.

## 1. Começar pelo trabalho da tela

Antes de desenhar ou codar, registrar quatro respostas:

- quem usa esta tela;
- o que essa pessoa veio fazer;
- qual informação precisa dominar a hierarquia;
- qual ação principal encerra o trabalho com sucesso.

Uma tela não começa por “qual card usar?”. Ela começa por intenção.

## 2. Identificar o contexto do Lorion

Cada experiência deve deixar claro qual mundo está sendo explorado:

- **social** — pessoas, relações, conversa, reputação;
- **biblioteca** — leitura, coleção, descoberta, memória;
- **pesquisa** — autoria, evidência, publicação, referência;
- **projetos** — processo, criação, colaboração, progresso;
- **oficina** — solução, técnica, construção, diagnóstico;
- **comunidades** — pertencimento, discussão, produção coletiva.

O contexto define linguagem, composição e motion. Não deve existir uma única aparência genérica aplicada a tudo.

## 3. Definir direção antes de componentes

Cada nova tela ou grande revisão precisa de uma pequena direção de design antes da implementação:

```text
Intenção
↓
Hierarquia
↓
Composição
↓
Tipografia
↓
Superfícies e contraste
↓
Elemento assinatura
↓
Interação e movimento
↓
Estados e acessibilidade
```

Tokens e componentes existentes devem ser reutilizados, mas não podem obrigar todas as experiências a terem a mesma composição.

## 4. Gastar a ousadia em um ponto

Cada experiência pode possuir um elemento memorável, desde que ele tenha relação com o conteúdo.

Exemplos de linguagem, não receitas obrigatórias:

- Biblioteca pode usar comportamento inspirado em livro, prateleira ou página.
- Pesquisa pode usar linguagem editorial, arquivo ou documento.
- Comunidades podem usar movimento mais orgânico e social.
- Oficina pode usar feedback técnico, montagem e precisão.

O restante da interface deve sustentar esse elemento, não competir com ele.

## 5. Estrutura precisa significar alguma coisa

Divisores, números, etiquetas, selos, ornamentos e agrupamentos só entram quando ajudam a entender conteúdo, estado ou relação.

Não usar por hábito:

- numeração decorativa sem sequência real;
- dourado como borda universal;
- ícone sem função semântica;
- card para qualquer tipo de conteúdo;
- gradiente apenas para preencher espaço;
- latim quando uma palavra simples é mais clara.

## 6. Tipografia é parte da identidade

A hierarquia tipográfica precisa diferenciar claramente:

- identidade e títulos editoriais;
- leitura longa;
- interface e ações;
- metadados, datas e dados técnicos.

Dark academia não significa usar serifada em todo lugar. Legibilidade e função vêm antes da decoração.

## 7. Motion explica mudança

Movimento deve responder a pelo menos uma função:

- mostrar de onde algo veio ou para onde foi;
- confirmar uma ação;
- comunicar hierarquia;
- revelar contexto;
- ajudar orientação espacial;
- representar de forma coerente o objeto ou domínio.

Preferir um momento bem orquestrado a muitos efeitos simultâneos.

Regras técnicas:

- preferir `transform` e `opacity` quando possível;
- evitar sistemas diferentes disputando a mesma propriedade;
- não manter `will-change` permanentemente sem necessidade;
- respeitar `prefers-reduced-motion`;
- nunca bloquear navegação essencial por causa de animação;
- testar mobile, zoom, teclado e interrupções rápidas.

## 8. App-first e componente adaptativo

Projetar primeiro o comportamento do componente, depois sua adaptação ao espaço disponível.

A validação mínima inclui:

- 320 px;
- 375 px;
- 430 px;
- tablet;
- desktop;
- 125% a 200% de zoom;
- texto ampliado;
- landscape;
- split screen quando aplicável.

Usar `minmax(0, 1fr)`, `min-width: 0`, medidas fluidas e container queries quando a adaptação depender do componente, não do dispositivo.

## 9. Estados fazem parte do design

Toda experiência que depende de dados precisa prever, conforme aplicável:

```text
idle
loading
success
empty
error
permission-denied
offline
```

Um estado vazio deve orientar a próxima ação. Um erro deve dizer o que ocorreu e qual caminho existe para resolver. Não esconder falhas com mensagens vagas.

## 10. Texto é interface

Escrever do ponto de vista de quem usa o produto.

Preferir:

- verbos diretos;
- nomes consistentes entre botão, resultado e notificação;
- explicações concretas;
- uma função por rótulo.

Exemplo:

```text
Publicar
↓
Publicado
```

Evitar trocar o mesmo conceito por vários sinônimos apenas para parecer sofisticado.

## 11. Acessibilidade é piso de qualidade

Antes de considerar uma interface concluída, verificar:

- foco visível;
- navegação por teclado;
- ordem semântica;
- contraste;
- alvos de toque adequados;
- `aria-*` somente quando necessário e correto;
- conteúdo compreensível sem depender apenas de cor;
- fallback para movimento reduzido.

## 12. Crítica antes e depois de construir

### Antes

Perguntar:

- a solução nasce do trabalho real da tela?
- existe alguma decisão genérica feita apenas por hábito?
- o elemento assinatura ajuda o produto ou apenas chama atenção?
- a hierarquia funciona sem animação?

### Depois

Perguntar:

- a primeira ação está evidente?
- a tela ainda parece Lorion sem o logotipo?
- existe decoração que pode ser removida?
- alguma informação está dentro de um card apenas porque era conveniente?
- a versão mobile parece um aplicativo planejado ou um desktop comprimido?
- teclado, zoom e movimento reduzido continuam funcionando?

## 13. Critério de entrada no código

Uma mudança visual relevante só deve avançar quando possuir:

1. intenção definida;
2. hierarquia definida;
3. comportamento responsivo previsto;
4. estados previstos;
5. papel do motion definido ou decisão explícita de não animar;
6. critérios de acessibilidade;
7. responsabilidade clara no código.

O objetivo do método não é limitar experimentação. É garantir que experimentação tenha motivo, qualidade e coerência com o Lorion.

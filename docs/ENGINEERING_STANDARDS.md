# Studiorium Engineering Standards

Este documento registra regras padrão para qualquer agente, modelo ou colaborador que trabalhe no Studiorium.

## 1. Fluxo de trabalho com GitHub

- Toda correção, melhoria ou nova função deve possuir uma Issue correspondente.
- Toda alteração deve ser desenvolvida em branch própria e integrada por Pull Request.
- A descrição da PR deve mencionar a Issue relacionada, usando `Refs #N` ou `Closes #N` quando apropriado.
- Deploys devem ser gerenciados a partir de PRs e seus checks. Evitar mudanças diretas na `main`.
- Mudanças grandes devem ser divididas em incrementos pequenos, revisáveis e testáveis.

## 2. Motion e experiência de uso

Usar princípios de motion de forma contextual e funcional. A referência citada pelo projeto é Motion Principles, mas o Studiorium deve preservar identidade própria e não copiar interfaces externas.

Regras:

- Sempre prever estado de loading quando houver espera perceptível.
- Usar skeleton quando a estrutura visual do conteúdo for conhecida.
- Usar lazy loading para imagens e conteúdo pesado quando aplicável.
- Entradas e saídas devem ser suaves e curtas, sem bloquear a navegação.
- Ações longas devem indicar progresso quando houver informação real de progresso.
- Transições de layout devem ajudar o usuário a entender origem, destino e mudança de estado.
- Mobile deve receber interações próprias para toque e gestos, sem depender de hover.
- Sempre respeitar `prefers-reduced-motion`.
- Não animar tudo. Motion deve explicar hierarquia, causa, continuidade ou feedback.

## 3. Observabilidade

A observabilidade deve crescer de forma proporcional à aplicação.

Prioridade recomendada:

1. logs estruturados e health checks;
2. rastreamento de erros com Sentry ou solução equivalente;
3. OpenTelemetry para traces e métricas quando a arquitetura justificar;
4. Datadog, New Relic ou outro fornecedor completo apenas se houver necessidade operacional real.

Evitar adicionar várias plataformas redundantes ao mesmo tempo.

## 4. Qualidade de código

Manter validações automáticas no CI e evoluir gradualmente as ferramentas.

Ferramentas a avaliar conforme necessidade do stack:

- Biome ou equivalente para lint e formatação;
- Commitlint para convenção de commits;
- Knip para dependências, exports e código não utilizado;
- contratos/regras arquiteturais para impedir acoplamento indevido;
- mutation testing com Stryker quando a suíte de testes estiver madura.

Nenhuma ferramenta deve ser adicionada apenas para cumprir checklist. Cada dependência precisa justificar custo, manutenção e benefício.

## 5. Testes

Toda feature deve considerar a pirâmide de testes adequada:

- testes unitários para lógica isolada;
- integração para módulos e APIs;
- E2E para jornadas essenciais.

Playwright é a referência preferencial para E2E quando aplicável. Cobertura pode ser publicada por Codecov ou equivalente quando isso melhorar a revisão e a manutenção.

Fluxos críticos mínimos a proteger por E2E conforme forem estabilizados:

- autenticação;
- criação e publicação;
- comunidades;
- navegação entre cards e páginas de detalhe;
- filtros e busca;
- ações administrativas críticas.

## 6. Critério padrão antes de merge

Uma PR só deve ser integrada quando:

- a Issue relacionada estiver referenciada;
- o CI estiver verde;
- não houver regressão conhecida de layout ou navegação;
- responsividade e acessibilidade tiverem sido consideradas;
- estados de loading, erro, vazio e sucesso tiverem sido tratados quando aplicáveis;
- animações respeitarem reduced motion;
- não houver atalhos frágeis, dependências desnecessárias ou código duplicado introduzidos pela mudança.

Issue de adoção inicial: #60.

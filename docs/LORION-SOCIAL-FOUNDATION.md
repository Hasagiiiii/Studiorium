# Lorion — fundação da rede social

## Objetivo da próxima fase

O próximo salto do produto é deixar de ser uma plataforma com recursos sociais e passar a funcionar como uma rede social de conhecimento de fato.

A transformação deve acontecer sem apagar biblioteca, pesquisa, projetos, oficina e comunidades. O social conecta essas áreas; ele não substitui o restante do produto.

## Modelo mental

```text
Pessoa
├── segue → Pessoa
├── participa → Comunidade
├── publica → Conteúdo
├── comenta → Conteúdo
├── reage → Conteúdo
├── guarda → Conteúdo
└── cria → Projeto / Pesquisa / Tutorial / Review

                    ↓

                 Feed

Seguindo | Para você | Recentes | Em alta
```

## Entidades sociais mínimas

Antes de criar novas tabelas, verificar contratos e estruturas que já existem no banco para evitar duplicação.

A fundação desejada contempla conceitos equivalentes a:

```text
user_follows
user_blocks
user_mutes

comments
comment_reactions
content_reactions
content_saves

notifications
activity_events
```

Os nomes finais dependem do schema atual. O importante é haver responsabilidade clara e fonte única de verdade.

## Fase 1 — grafo social

Entregar:

- seguir e deixar de seguir pessoas;
- contagem de seguidores e seguindo;
- listar seguidores e seguindo;
- bloquear;
- silenciar;
- sugestões simples de pessoas e comunidades.

Regras:

- não permitir seguir a si mesmo;
- ações idempotentes quando possível;
- bloqueio deve impedir relações incompatíveis no backend;
- IDs recebidos do cliente são sempre não confiáveis;
- autorização acontece no servidor e no banco, não apenas na interface.

## Fase 2 — publicação e conversa

O conteúdo social deve aceitar diferentes naturezas sem transformar tudo no mesmo card genérico:

- publicação curta;
- imagem;
- pesquisa;
- projeto;
- tutorial;
- review de livro;
- discussão.

Interações mínimas:

- Hype/reação;
- comentários;
- respostas encadeadas;
- guardar;
- editar conteúdo próprio;
- excluir conteúdo próprio conforme regra de domínio;
- compartilhar internamente;
- denunciar.

## Fase 3 — feed

Começar com regras compreensíveis. Não iniciar por um algoritmo opaco ou por machine learning.

Primeira composição experimental:

```text
70% relações que a pessoa escolheu
20% descoberta relacionada
10% conteúdo em alta
```

A proporção é uma hipótese de produto, não uma constante definitiva. Ela deve ser validada por uso real.

Sinais possíveis para evolução futura:

- relação direta;
- comunidade em comum;
- recência;
- tipo de conteúdo preferido;
- Hypes, comentários e guardados;
- diversidade de autores;
- qualidade e confiança;
- conteúdo já visto;
- bloqueios e silenciamentos.

Não usar métricas de engajamento para burlar preferências explícitas de bloqueio, segurança ou moderação.

## Modos do feed

### Seguindo

Prioriza pessoas e comunidades que o usuário escolheu acompanhar.

### Para você

Mistura relações e descoberta relacionada, com explicações futuras quando uma recomendação não for óbvia.

### Recentes

Ordenação cronológica útil para quem quer previsibilidade.

### Em alta

Deve usar janela de tempo e qualidade relativa. Não deve ser apenas uma lista eterna dos conteúdos com maior contagem histórica.

## Perfil como identidade

O perfil social deve unir identidade e trabalho:

- foto e capa;
- nome e `@username`;
- bio;
- área de atuação;
- formação declarada;
- especialidades verificadas;
- seguidores e seguindo;
- projetos;
- pesquisas/publicações;
- biblioteca pessoal;
- comunidades;
- atividade recente quando permitido;
- controles de privacidade.

Verificação profissional não transforma opinião em verdade absoluta; ela apenas confirma a credencial que foi validada.

## Comunidades

Comunidades precisam funcionar como espaços sociais completos:

- membros;
- papéis locais;
- feed próprio;
- discussões;
- conteúdo vinculado;
- projetos colaborativos;
- moderação;
- descoberta.

A comunidade de criação continua sendo um ponto de entrada para criações, mas novas comunidades não devem depender de lógica codificada especificamente para uma única comunidade.

## Notificações

Categorias iniciais:

- novo seguidor;
- Hype relevante;
- comentário;
- resposta;
- menção;
- convite ou evento de comunidade;
- mudança de moderação;
- atualização de conteúdo acompanhado;
- ação de segurança da conta.

Requisitos:

- lida/não lida;
- link de destino seguro;
- preferência por categoria no futuro;
- evitar gerar várias notificações redundantes para o mesmo evento;
- possibilidade de agregação quando apropriado.

## Busca e descoberta

A busca global deve caminhar para uma única entrada capaz de encontrar:

```text
Pessoas
Comunidades
Publicações
Pesquisas
Projetos
Tutoriais
Livros e reviews
```

Filtros refinam o resultado; não devem obrigar o usuário a saber previamente em qual seção o conteúdo vive.

## App Shell social

Prioridade de navegação mobile:

```text
Início
Explorar
Criar
Comunidades
Perfil
```

O botão central de criação abre um launcher contextual:

```text
Publicação
Projeto
Pesquisa
Discussão
Tutorial
Review de livro
Comunidade
```

Biblioteca, projetos, pesquisas e oficina continuam acessíveis como áreas do produto, sem tentar colocar todas as rotas na barra inferior.

## Estados de rede

Componentes sociais que dependem de servidor devem possuir estados explícitos, conforme o caso:

```text
idle
loading
optimistic
success
empty
error
permission-denied
```

A atualização otimista só entra quando existir estratégia confiável de rollback.

## Segurança e confiança

A rede social deve nascer com:

- autorização server-side;
- RLS/políticas de banco quando aplicável;
- proteção contra IDOR/BOLA;
- validação runtime de entrada externa;
- rate limiting em ações abusáveis;
- bloqueio e denúncia;
- trilha de moderação para ações relevantes;
- escape/sanitização contra XSS;
- limites de upload;
- controle de conteúdo e proteção de menores conforme requisitos legais aplicáveis.

## Arquitetura de implementação

A evolução deve seguir a ordem já definida para reduzir dívida técnica:

```text
contratos de domínio
↓
schemas de validação runtime
↓
services por feature
↓
estados de UI padronizados
↓
features mais isoladas
↓
testes comportamentais
↓
tipagem gradual / JSDoc
↓
TypeScript
↓
App Shell
↓
React / Next quando a base justificar
```

Estrutura-alvo de responsabilidade:

```text
features/
  social-graph/
  feed/
  profiles/
  communities/
  notifications/
  comments/

components/
  ui/
  navigation/
  feedback/
```

Não criar `Card2`, `CardFinal`, `CardMobile` ou equivalentes para resolver diferenças de domínio. Componentes genéricos ficam genéricos; componentes de pesquisa, projeto, livro e publicação pertencem às respectivas features.

## Primeira entrega social concreta

A primeira entrega que deve ser implementada após a consolidação arquitetural é:

1. contrato de `Follow` e relações sociais;
2. schema runtime de entradas de seguir/bloquear/silenciar;
3. service/API do grafo social;
4. endpoints e autorização;
5. persistência no Supabase/PostgreSQL;
6. botão seguir/deixar de seguir no perfil;
7. contagens e listas;
8. testes de comportamento e segurança;
9. feed “Seguindo” consumindo o grafo real;
10. notificações de novo seguidor sem duplicação.

Isso cria a primeira cadeia social completa do Lorion: relação → persistência → interface → feed → notificação.

# Regras de arquitetura de código — Studiorium v4

Estas regras valem somente para a árvore `v4/` do Studiorium. Elas existem para manter o produto evolutivo, legível e testável sem transformar organização em fragmentação artificial.

## 1. Organizar por responsabilidade e funcionalidade

- Toda funcionalidade deve ter uma localização previsível.
- Preferir módulos por feature (`communities`, `interactions`, `notifications`, `posts`, `profiles`, `projects`) a arquivos genéricos que concentram responsabilidades diferentes.
- Evitar duplicar a mesma funcionalidade em hubs, rotas ou catálogos paralelos.

## 2. Manter fronteiras explícitas

- `packages/domain`: regras puras de negócio e decisões que não dependem de HTTP, React ou banco.
- `packages/contracts`: schemas e validação runtime dos dados que entram e saem das fronteiras.
- `packages/database`: consultas e persistência server-side.
- `apps/api`: autenticação, autorização, transporte HTTP e coordenação de casos de uso.
- `packages/api-client`: comunicação tipada entre frontend e API.
- `apps/web`: composição de interface e estado de apresentação.

Uma camada não deve absorver silenciosamente a responsabilidade da camada vizinha.

## 3. Handlers devem ser coordenadores

Handlers podem autenticar, validar a requisição, chamar serviços e formar a resposta. Eles não devem acumular composição de notificações, políticas de negócio, queries SQL, regras de permissão e transformação de UI no mesmo arquivo.

Quando uma responsabilidade cresce ou começa a ser reutilizada, ela deve virar um serviço ou módulo da feature correspondente.

## 4. Arquivos e funções devem permanecer legíveis

- Evitar arquivos e funções excessivamente grandes.
- Preferir funções com uma responsabilidade clara.
- Manter linhas legíveis e curtas quando possível.
- Não quebrar uma função em várias funções minúsculas apenas para reduzir contagem de linhas.
- Não criar abstrações sem uso real ou sem ganho de clareza.

## 5. Reutilizar contratos em vez de repetir validação

Regras estruturais compartilhadas, como limites de tamanho, identificadores e enums, devem possuir uma fonte única em `@lorion/contracts`. Criação e edição da mesma entidade não devem divergir por cópia de schema.

## 6. Regras de negócio devem ser testáveis sem infraestrutura

Sempre que uma decisão puder ser expressa sem banco ou HTTP, preferir uma função pura em `@lorion/domain` e cobri-la com testes comportamentais. Exemplos: destinatário de notificação, elegibilidade, visibilidade e transições de estado.

## 7. Serviços concentram efeitos colaterais da feature

Persistência composta, envio de notificação, integração externa, cache e outras operações com efeitos colaterais devem ficar atrás de serviços com nomes explícitos. O chamador informa a intenção; o serviço executa a mecânica.

O serviço de notificações, por exemplo, deve ser responsável por montar e persistir notificações de interação e impedir autonotificação como defesa adicional.

## 8. Autorização é server-side

A interface pode esconder ações que o usuário não pode executar, mas isso nunca substitui autorização na API e, quando aplicável, políticas no banco. Permissões devem ser tratadas como capacidade (`canRead`, `canEdit`, `canModerate`) e não como condicionais espalhadas pela UI.

## 9. Uma funcionalidade só entra quando fecha o fluxo

Uma superfície ativa deve possuir, conforme aplicável:

- contrato;
- validação runtime;
- regra de domínio;
- persistência;
- autorização;
- API;
- client tipado;
- estados de loading, erro e vazio;
- testes do comportamento crítico.

Funcionalidades incompletas não devem aparecer como controles ativos apenas para simular progresso.

## 10. Benchmark open source é etapa obrigatória

Antes de criar ou alterar de forma relevante uma feature, pesquisar projetos open source maduros que resolvam problema semelhante. A comparação deve acontecer de forma contínua ao longo da evolução da v4, e não apenas no início de uma feature.

O objetivo é entender:

- como a responsabilidade é separada;
- quais contratos e políticas são explícitos;
- como autorização e moderação são aplicadas;
- como estados de erro, vazio, loading e concorrência são tratados;
- quais decisões foram tomadas para escala, manutenção e segurança;
- quais abstrações são realmente necessárias e quais seriam excesso para o Studiorium.

Sempre que possível, comparar mais de uma referência. Para funcionalidades sociais, priorizar redes sociais e comunidades open source maduras; para conhecimento e acervo, priorizar knowledge bases, fóruns e plataformas colaborativas; para infraestrutura, observar projetos consolidados da mesma stack ou de arquitetura equivalente.

## 11. Referências open source são padrões, não fonte para cópia

Projetos externos podem orientar separação de serviços, políticas, moderação, notificações, busca e organização do conhecimento. O Studiorium deve reaplicar o padrão de acordo com seu domínio e sua stack, sem transplantar código, nomes internos ou complexidade que não resolva um problema real do produto.

Antes de reutilizar uma ideia, responder três perguntas:

1. Qual problema real do Studiorium isso resolve?
2. Qual é a menor adaptação que preserva o benefício?
3. A mudança melhora manutenção, segurança, experiência ou escala sem criar complexidade desnecessária?

Se a resposta não for clara, a ideia não entra apenas porque outro projeto a utiliza.

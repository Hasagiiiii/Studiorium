# Lorion — arquitetura de produto e marca

## Decisão de marca

O ecossistema passa a usar quatro nomes com responsabilidades diferentes:

- **Studiorium** é a marca-mãe e o ecossistema.
- **Orium Labs** é o braço de tecnologia e desenvolvimento.
- **Lorion** é a rede social de conhecimento.
- **Loren** é a inteligência e assistente integrada ao produto.

A separação evita colocar todas as responsabilidades sob o mesmo nome e permite que novos produtos existam no futuro sem descaracterizar o Studiorium.

## Posicionamento do Lorion

Lorion não deve ser apresentado como uma plataforma escolar nem como um feed genérico. Ele é uma rede social em que identidade, descoberta e relacionamento são organizados ao redor de conhecimento, criação e colaboração.

Frase de posicionamento provisória:

> **Lorion — conhecimento conecta.**

A identidade do produto combina cinco pilares:

- rede social de conhecimento;
- biblioteca pessoal;
- portfólio acadêmico e técnico;
- comunidades;
- workspace de projetos e criações.

O feed é uma porta de entrada, não o produto inteiro.

## Papel da Loren

Loren não é uma página de “chat com IA”. Ela deve funcionar como uma presença contextual dentro do Lorion, capaz de conversar, explicar, encontrar conteúdo e executar ações permitidas pelo usuário.

Princípios:

- conversar em linguagem natural;
- usar o contexto da área em que a pessoa está;
- não ocupar a experiência inteira quando uma ajuda pequena resolve;
- diferenciar consulta de ação;
- pedir confirmação antes de ações importantes ou destrutivas;
- permitir que o usuário entenda e controle o que a Loren pode fazer;
- manter chaves e ferramentas sensíveis no servidor.

Modelo de permissão desejado:

```text
Nível 1 — leitura
pesquisar, consultar projetos, ler conteúdo autorizado

Nível 2 — ações simples
salvar conteúdo, criar tarefa, editar rascunho

Nível 3 — ações importantes
publicar, apagar, enviar, alterar dados da conta

Nível 4 — crítico
sempre requer confirmação explícita
```

## Linguagem do produto

A interface deve preferir termos que as pessoas reconhecem. Nem tudo precisa receber um nome temático.

Vocabulário inicial:

- reação principal: **Hype**;
- salvar: **Guardar**;
- grupos sociais: **Comunidades**;
- assistente: **Loren**;
- credencial: **Especialista verificado**;
- perfil e feed mantêm nomes simples quando isso melhora a compreensão.

## Relação entre as marcas

Na experiência principal, Lorion deve ser a marca visível. Studiorium e Orium Labs aparecem de forma institucional e discreta.

Exemplo:

```text
LORION
Conhecimento conecta.

by Orium Labs
parte do ecossistema Studiorium
```

Não exibir as quatro marcas com o mesmo peso visual na mesma tela.

## Infraestrutura atual e evolução

Base atual:

```text
Código e CI       GitHub
Deploy            Vercel
Dados/backend     Supabase / PostgreSQL
```

Evolução planejada, somente quando houver necessidade real:

```text
Observabilidade   Sentry
E-mail            serviço transacional dedicado
DNS/CDN/proteção  Cloudflare quando houver domínio próprio consolidado
```

Ferramentas não entram no projeto apenas porque possuem plano gratuito. Cada dependência deve resolver um problema observável e ter custo operacional conhecido.

## Regra para novas decisões

Toda nova funcionalidade deve responder a pelo menos uma destas perguntas:

1. Ela melhora uma conexão entre pessoas?
2. Ela melhora descoberta ou organização de conhecimento?
3. Ela ajuda alguém a criar, colaborar ou demonstrar trabalho?
4. Ela reforça segurança, confiança ou controle do usuário?

Se a resposta for “não” para todas, a funcionalidade precisa ser reavaliada antes de entrar no roadmap.

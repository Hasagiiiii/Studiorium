# Studiorium v3.1 — Comunidade verificada

## Identidade acadêmica

- novos tipos de perfil, incluindo monitor, técnico, profissional, autodidata e internauta;
- campos de curso, instituição e nível de formação;
- solicitação de verificação com análise administrativa;
- selos públicos de especialista e colaborador ativo.

## Equipe e moderação

- cargos de moderador, curador, editor e administrador;
- fila de moderação acessível à equipe sem liberar configurações administrativas;
- painel próprio para revisar comprovações de formação.

## Biblioteca e descoberta

- estante visual de livros no catálogo;
- estante pessoal na Escrivaninha;
- pesquisa pública de usuários por formação e especialidade;
- impulso único por usuário para publicações aprovadas.

## Publicações e experiência

- foto de apresentação opcional em JPG, PNG ou WebP;
- cartão dark academia original preservado quando não existe foto;
- central interna de notificações responsiva;
- proteção contra envios repetidos durante o cadastro.

## Banco e segurança

- migração `supabase/upgrade-v3.1-community-identity.sql`;
- RLS habilitado e acesso direto revogado nas novas tabelas;
- funções privilegiadas restritas à API de servidor;
- índices para notificações não lidas, fila de verificação, estante e descoberta por impulsos.
- compatibilidade com a primeira estrutura 3.1 já aplicada no banco, preservando formação,
  especialidade e comprovantes existentes.
- triagem local sem chave externa, com pontuação de risco e revisão humana;
- compartilhamento opcional de projetos acadêmicos, privados por padrão e sem expor notas.

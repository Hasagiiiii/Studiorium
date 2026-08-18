# Studiorium v2.7.0

## Estrutura e manutenção

- eventos da interface separados por navegação, projetos, comunidade, filtros, conta e ADM;
- HTML das views e folhas de estilo formatados para revisão humana;
- Prettier fixado no projeto e limite automático de 140 caracteres por linha;
- validação recursiva de todos os módulos de interface, scripts, testes e SQL operacional.

## Segurança e confiabilidade

- JSON pré-processado inválido agora retorna HTTP 400;
- uploads validam Base64, MIME, extensão e assinatura do conteúdo;
- migração v2.7 corrige a coluna legada `event_type` sem perder eventos anteriores;
- schema consolidado inclui rate limit, eventos de segurança, índices e revogação de acesso direto;
- provisionamento administrativo explícito, sem promoção automática pelo e-mail.

## Validação

- 18 testes automatizados;
- checagem de sintaxe do backend e de todos os módulos ES;
- formatação verificada no CI.

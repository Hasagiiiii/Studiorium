const protectedGroups =
  '(?:negros?|mulheres?|imigrantes?|estrangeiros?|nordestinos?|indigenas?|judeus?|muculmanos?|gays?|lesbicas?|pessoas trans)';

type Signal = { category: string; severity: number; message: string };
type Rule = Signal & { patterns: RegExp[] };

const rules: Rule[] = [
  {
    category: 'risco_menor',
    severity: 10,
    message: 'Possível exploração ou aliciamento de menor.',
    patterns: [
      /\bpornografia infantil\b/,
      /\bconteudo sexual\s+(?:com|de)\s+(?:um\s+)?menor\b/,
      /\b(?:explorar|aliciar)\s+(?:uma\s+)?crianca\b/,
      /\b(?:vender|trocar|compartilhar)\s+(?:foto|video)\s+intim[oa]\s+de\s+menor\b/,
    ],
  },
  {
    category: 'violencia',
    severity: 10,
    message: 'Ameaça direta ou incentivo explícito à violência.',
    patterns: [
      /\b(?:vou|vamos|quero|pretendo)\s+(?:te\s+|lhe\s+)?(?:matar|espancar|agredir)\b/,
      /\b(?:matar|exterminar)\s+(?:todos?|todas?|um\s+grupo|uma\s+comunidade)\b/,
    ],
  },
  {
    category: 'discriminacao',
    severity: 9,
    message: 'Incentivo à exclusão ou violência contra um grupo protegido.',
    patterns: [
      new RegExp(`\\b${protectedGroups}\\s+(?:nao\\s+)?(?:merecem|deveriam)\\s+(?:morrer|sumir|ser expuls[oa]s?)\\b`),
      new RegExp(`\\b(?:expulsar|eliminar)\\s+(?:todos?|todas?)\\s+(?:os|as)\\s+${protectedGroups}\\b`),
    ],
  },
  {
    category: 'dados_pessoais',
    severity: 5,
    message: 'Possível exposição de dados pessoais.',
    patterns: [
      /\bcpf\s*(?:e|eh|:)?\s*\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/,
      /\b(?:endereco|telefone)\s+(?:da|do|de)\s+(?:vitima|pessoa|aluno|professor)\b/,
      /\bvender\s+dados\s+pessoais\b/,
    ],
  },
  {
    category: 'assedio',
    severity: 4,
    message: 'Possível assédio, perseguição ou humilhação direcionada.',
    patterns: [
      /\b(?:vamos|quero)\s+(?:humilhar|perseguir|expor)\s+(?:ele|ela|essa pessoa)\b/,
      /\b(?:ataquem|assediem)\s+(?:o perfil|essa pessoa|ele|ela)\b/,
    ],
  },
  {
    category: 'golpe',
    severity: 4,
    message: 'Possível golpe ou pedido financeiro enganoso.',
    patterns: [
      /\b(?:pix|pagamento)\s+(?:para|pra)\s+liberar\s+(?:premio|beneficio|saque)\b/,
      /\brenda\s+garantida\s+sem\s+risco\b/,
    ],
  },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function analyzeText(text: string) {
  const original = String(text || '').trim();
  const normalized = normalize(original);
  const signals: Signal[] = rules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(normalized)))
    .map(({ category, severity, message }) => ({ category, severity, message }));
  const links = original.match(/https?:\/\/\S+/gi) || [];
  if (links.length >= 6) {
    signals.push({ category: 'spam', severity: 3, message: 'Quantidade incomum de links no mesmo conteúdo.' });
  }
  const score = signals.reduce((total, signal) => total + signal.severity, 0);
  const decision =
    signals.some((signal) => signal.severity >= 9) || score >= 10
      ? 'blocked'
      : score >= 3
        ? 'flagged'
        : 'approved';
  return { decision, score, signals } as const;
}

export function assertPublishableText(text: string, label = 'Conteúdo'): void {
  const value = String(text || '').trim();
  if (!value) throw Object.assign(new Error(`${label}: o conteúdo não pode ficar vazio.`), { status: 400 });
  if (value.length > 80_000) throw Object.assign(new Error(`${label}: o texto ultrapassa o limite permitido.`), { status: 400 });
  const analysis = analyzeText(value);
  if (analysis.decision === 'blocked') {
    throw Object.assign(new Error(`${label}: o conteúdo foi bloqueado pela triagem preventiva.`), {
      status: 422,
      code: 'CONTENT_BLOCKED',
    });
  }
  if (analysis.decision === 'flagged') {
    throw Object.assign(new Error(`${label}: ajuste a redação antes de publicar; o texto acionou a triagem preventiva.`), {
      status: 422,
      code: 'CONTENT_REVIEW_REQUIRED',
    });
  }
}

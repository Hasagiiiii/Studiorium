const protectedGroups =
  '(?:negros?|mulheres?|imigrantes?|estrangeiros?|nordestinos?|indigenas?|' +
  'judeus?|muculmanos?|gays?|lesbicas?|pessoas trans)';

const signalRules = [
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
      /\bameacar\s+alguem\b/,
    ],
  },
  {
    category: 'discriminacao',
    severity: 9,
    message: 'Incentivo à exclusão ou violência contra um grupo protegido.',
    patterns: [
      new RegExp(
        `\\b${protectedGroups}\\s+(?:nao\\s+)?(?:merecem|deveriam)\\s+` +
          '(?:morrer|sumir|ser expuls[oa]s?)\\b',
      ),
      new RegExp(
        `\\b(?:expulsar|eliminar)\\s+(?:todos?|todas?)\\s+(?:os|as)\\s+${protectedGroups}\\b`,
      ),
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

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function analyzeText(text) {
  const original = String(text || '').trim();
  const normalized = normalize(original);
  const signals = signalRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(normalized)))
    .map(({ category, severity, message }) => ({ category, severity, message }));

  const links = original.match(/https?:\/\/\S+/gi) || [];
  if (links.length >= 6) {
    signals.push({
      category: 'spam',
      severity: 3,
      message: 'Quantidade incomum de links no mesmo conteúdo.',
    });
  }

  const score = signals.reduce((total, signal) => total + signal.severity, 0);
  const decision =
    signals.some((signal) => signal.severity >= 9) || score >= 10
      ? 'blocked'
      : score >= 3
        ? 'flagged'
        : 'approved';

  return { decision, score, signals };
}

function moderate(text) {
  const normalized = String(text || '').trim();
  if (!normalized)
    return { ok: false, category: 'vazio', message: 'O conteúdo não pode ficar vazio.' };
  if (normalized.length > 80_000)
    return { ok: false, category: 'limite', message: 'O texto ultrapassa o limite permitido.' };

  const analysis = analyzeText(normalized);
  if (analysis.decision === 'blocked') {
    return {
      ok: false,
      category: analysis.signals[0]?.category || 'risco',
      message: 'O conteúdo foi bloqueado e precisa de revisão.',
      score: analysis.score,
      signals: analysis.signals,
    };
  }

  return {
    ok: true,
    category: analysis.decision === 'flagged' ? 'revisao' : 'normal',
    reviewRequired: analysis.decision === 'flagged',
    score: analysis.score,
    signals: analysis.signals,
  };
}

module.exports = { analyzeText, moderate };

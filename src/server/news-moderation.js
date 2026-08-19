const { analyzeText } = require('./moderation');

const sensationalPatterns = [
  /\bchocante\b/i,
  /\bvoc[eê] n[aã]o vai acreditar\b/i,
  /\ba verdade que ningu[eé]m conta\b/i,
  /\bcompartilhe antes que apaguem\b/i,
  /!{3,}/,
];

function cleanList(input) {
  return Array.isArray(input)
    ? input
        .map((item) =>
          String(item || '')
            .trim()
            .slice(0, 300),
        )
        .filter(Boolean)
        .slice(0, 10)
    : [];
}

function cleanReview(value) {
  const decision = value?.decision === 'approved' ? 'approved' : 'flagged';
  return {
    decision,
    summary: String(value?.summary || 'Triagem local concluída.')
      .trim()
      .slice(0, 1000),
    risks: cleanList(value?.risks),
    sourceAssessment: String(value?.sourceAssessment || '')
      .trim()
      .slice(0, 1000),
    suggestions: cleanList(value?.suggestions),
    score: Math.max(0, Math.min(100, Number(value?.score || 0))),
    engine: 'studiorium_local_rules_v1',
    reviewedAt: new Date().toISOString(),
    purpose: 'triage_only_human_certification_required',
  };
}

function inspectSources(sources = []) {
  const valid = [];
  for (const source of Array.isArray(sources) ? sources : []) {
    try {
      const url = new URL(source.url);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      valid.push({ protocol: url.protocol, host: url.hostname.replace(/^www\./, '') });
    } catch {
      // A rota já rejeita URLs inválidas; a triagem apenas as desconsidera.
    }
  }

  const hosts = new Set(valid.map((source) => source.host));
  const risks = [];
  const suggestions = [];
  let score = 0;

  if (valid.length < 2) {
    risks.push('Menos de duas fontes verificáveis.');
    suggestions.push('Inclua pelo menos duas fontes verificáveis.');
    score += 5;
  }
  if (valid.length >= 2 && hosts.size < 2) {
    risks.push('As fontes informadas pertencem ao mesmo domínio.');
    suggestions.push('Acrescente uma fonte independente para comparação.');
    score += 2;
  }
  if (valid.some((source) => source.protocol !== 'https:')) {
    risks.push('Há fonte sem conexão HTTPS.');
    suggestions.push('Prefira fontes publicadas em páginas HTTPS.');
    score += 1;
  }

  return {
    risks,
    suggestions,
    score,
    summary: `${valid.length} fonte(s) válida(s) em ${hosts.size} domínio(s).`,
  };
}

function moderateNews(article) {
  const text = `${article.title || ''}\n${article.summary || ''}\n${article.body || ''}`;
  const textAnalysis = analyzeText(text);
  const sources = inspectSources(article.sources);
  const sensationalCount = sensationalPatterns.filter((pattern) => pattern.test(text)).length;
  const risks = textAnalysis.signals.map((signal) => signal.message);
  const suggestions = [];
  let score = textAnalysis.score + sources.score;

  if (sensationalCount) {
    risks.push('A redação contém sinais de sensacionalismo ou pressão por compartilhamento.');
    suggestions.push('Reescreva o título e os trechos chamativos em linguagem objetiva.');
    score += sensationalCount * 2;
  }
  if (textAnalysis.signals.some((signal) => signal.category === 'dados_pessoais')) {
    suggestions.push(
      'Remova ou anonimize dados que identifiquem pessoas sem necessidade editorial.',
    );
  }

  risks.push(...sources.risks);
  suggestions.push(...sources.suggestions);
  const decision = textAnalysis.decision === 'approved' && score < 3 ? 'approved' : 'flagged';

  return cleanReview({
    decision,
    summary:
      decision === 'approved'
        ? 'Nenhum sinal automático relevante foi encontrado; a certificação humana continua obrigatória.'
        : 'A triagem local encontrou pontos que precisam de atenção editorial humana.',
    risks,
    sourceAssessment: sources.summary,
    suggestions,
    score,
  });
}

module.exports = { cleanReview, inspectSources, moderateNews };

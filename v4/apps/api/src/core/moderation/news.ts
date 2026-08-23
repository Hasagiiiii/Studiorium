import type { NewsDraftInput } from '@lorion/contracts';
import { analyzeText } from './text.js';

const sensationalPatterns = [
  /\bchocante\b/i,
  /\bvoc[eê] n[aã]o vai acreditar\b/i,
  /\ba verdade que ningu[eé]m conta\b/i,
  /\bcompartilhe antes que apaguem\b/i,
  /!{3,}/,
];

export type NewsTriage = {
  decision: 'approved' | 'flagged';
  summary: string;
  risks: string[];
  sourceAssessment: string;
  suggestions: string[];
  score: number;
  engine: string;
  reviewedAt: string;
  purpose: string;
};

function inspectSources(sources: NewsDraftInput['sources']) {
  const valid: Array<{ protocol: string; host: string }> = [];
  for (const source of sources) {
    try {
      const url = new URL(source.url);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      valid.push({ protocol: url.protocol, host: url.hostname.replace(/^www\./, '') });
    } catch {
      // URLs inválidas são rejeitadas pelo contrato; a triagem apenas ignora aqui.
    }
  }

  const hosts = new Set(valid.map((source) => source.host));
  const risks: string[] = [];
  const suggestions: string[] = [];
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

export function triageNews(article: NewsDraftInput): NewsTriage {
  const text = `${article.title}\n${article.summary}\n${article.body}`;
  const textAnalysis = analyzeText(text);
  const sources = inspectSources(article.sources);
  const sensationalCount = sensationalPatterns.filter((pattern) => pattern.test(text)).length;
  const risks = textAnalysis.signals.map((signal) => signal.message);
  const suggestions: string[] = [];
  let score = textAnalysis.score + sources.score;

  if (sensationalCount) {
    risks.push('A redação contém sinais de sensacionalismo ou pressão por compartilhamento.');
    suggestions.push('Reescreva título e trechos chamativos em linguagem objetiva.');
    score += sensationalCount * 2;
  }
  if (textAnalysis.signals.some((signal) => signal.category === 'dados_pessoais')) {
    suggestions.push('Remova ou anonimize dados pessoais sem necessidade editorial.');
  }

  risks.push(...sources.risks);
  suggestions.push(...sources.suggestions);
  const decision: 'approved' | 'flagged' =
    textAnalysis.decision === 'approved' && score < 3 ? 'approved' : 'flagged';

  return {
    decision,
    summary:
      decision === 'approved'
        ? 'Nenhum sinal automático relevante foi encontrado; a certificação humana continua obrigatória.'
        : 'A triagem encontrou pontos que precisam de atenção editorial humana.',
    risks: risks.slice(0, 10),
    sourceAssessment: sources.summary,
    suggestions: suggestions.slice(0, 10),
    score: Math.max(0, Math.min(100, score)),
    engine: 'lorion_local_rules_v1',
    reviewedAt: new Date().toISOString(),
    purpose: 'triage_only_human_certification_required',
  };
}

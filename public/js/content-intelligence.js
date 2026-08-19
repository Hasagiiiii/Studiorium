const STOP_WORDS = new Set([
  'a',
  'ao',
  'as',
  'com',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'entre',
  'este',
  'esta',
  'isso',
  'mais',
  'na',
  'nas',
  'nao',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'que',
  'se',
  'sem',
  'sobre',
  'um',
  'uma',
]);

const CONTENT_FIELDS = [
  'title',
  'summary',
  'abstract',
  'description',
  'body',
  'content',
  'area',
  'category',
  'hub',
  'level',
  'docType',
  'style',
  'keywords',
  'tags',
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function stem(token) {
  if (token.length > 7 && token.endsWith('mente')) return token.slice(0, -5);
  if (token.length > 6 && token.endsWith('coes')) return `${token.slice(0, -3)}ao`;
  if (token.length > 5 && token.endsWith('oes')) return `${token.slice(0, -3)}ao`;
  if (token.length > 4 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function fieldText(item, fields = CONTENT_FIELDS) {
  return fields
    .flatMap((field) => {
      const value = item?.[field];
      return Array.isArray(value) ? value : [value];
    })
    .filter(Boolean)
    .join(' ');
}

function tokens(item, fields) {
  return new Set(
    (normalize(fieldText(item, fields)).match(/[a-z0-9]+/g) || [])
      .map(stem)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function exactFieldBoost(reference, candidate) {
  return ['area', 'category', 'hub', 'level', 'docType', 'style'].reduce((score, field) => {
    const referenceValue = normalize(reference?.[field]);
    const candidateValue = normalize(candidate?.[field]);
    return score + (referenceValue && referenceValue === candidateValue ? 0.16 : 0);
  }, 0);
}

function similarity(reference, candidate) {
  const referenceTokens = tokens(reference);
  const candidateTokens = tokens(candidate);
  let intersection = 0;

  referenceTokens.forEach((token) => {
    if (candidateTokens.has(token)) intersection += 1;
  });

  const union = new Set([...referenceTokens, ...candidateTokens]).size || 1;
  return intersection / union + exactFieldBoost(reference, candidate);
}

export function rankRelated(reference, candidates, limit = 3) {
  return candidates
    .filter((candidate) => {
      return candidate.id !== reference.id && candidate.slug !== reference.slug;
    })
    .map((candidate) => ({ candidate, score: similarity(reference, candidate) }))
    .filter((item) => item.score >= 0.08)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function emergentTopics(items, limit = 8) {
  const counts = new Map();
  const labels = new Map();

  items.forEach((item) => {
    const text = fieldText(item, ['keywords', 'tags', 'title']);
    const itemTokens = new Set(tokens({ text }, ['text']));
    const originalWords = text.match(/[\p{L}\p{N}]+/gu) || [];

    originalWords.forEach((word) => {
      const token = stem(normalize(word));
      if (itemTokens.has(token) && !labels.has(token)) labels.set(token, word);
    });
    itemTokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  });

  return [...counts]
    .filter(([, count]) => count >= (items.length >= 6 ? 2 : 1))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token, count]) => ({ label: labels.get(token) || token, count }));
}

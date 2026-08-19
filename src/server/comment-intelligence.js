const STOP_WORDS = new Set([
  'a',
  'ao',
  'aos',
  'aquela',
  'aquele',
  'aquilo',
  'as',
  'ate',
  'com',
  'como',
  'da',
  'das',
  'de',
  'dela',
  'dele',
  'do',
  'dos',
  'e',
  'ela',
  'ele',
  'em',
  'entre',
  'era',
  'essa',
  'esse',
  'esta',
  'este',
  'eu',
  'foi',
  'isso',
  'isto',
  'ja',
  'la',
  'mais',
  'mas',
  'me',
  'mesmo',
  'meu',
  'minha',
  'muito',
  'na',
  'nas',
  'nao',
  'nem',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'pela',
  'pelo',
  'por',
  'porque',
  'qual',
  'quando',
  'que',
  'quem',
  'se',
  'sem',
  'ser',
  'seu',
  'sua',
  'tambem',
  'tem',
  'ter',
  'um',
  'uma',
  'voce',
]);

const GENERIC_QUESTION_WORDS = new Set([
  'alguem',
  'ajuda',
  'conseguir',
  'duvida',
  'entender',
  'explicar',
  'fazer',
  'poder',
  'precisar',
  'problema',
  'saber',
]);

const CANONICAL_TERMS = new Map([
  ['arquivo', 'documento'],
  ['arquivos', 'documento'],
  ['documentos', 'documento'],
  ['foto', 'imagem'],
  ['fotos', 'imagem'],
  ['fotografia', 'imagem'],
  ['fotografias', 'imagem'],
  ['imagens', 'imagem'],
  ['referencia', 'fonte'],
  ['referencias', 'fonte'],
  ['fontes', 'fonte'],
  ['bibliografia', 'fonte'],
  ['bibliografias', 'fonte'],
  ['comentario', 'resposta'],
  ['comentarios', 'resposta'],
  ['respostas', 'resposta'],
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stem(token) {
  const canonical = CANONICAL_TERMS.get(token) || token;

  if (canonical.length > 7 && canonical.endsWith('mente')) return canonical.slice(0, -5);
  if (canonical.length > 6 && canonical.endsWith('coes')) return `${canonical.slice(0, -3)}ao`;
  if (canonical.length > 5 && canonical.endsWith('oes')) return `${canonical.slice(0, -3)}ao`;
  if (canonical.length > 5 && canonical.endsWith('ais')) return `${canonical.slice(0, -3)}al`;
  if (canonical.length > 4 && canonical.endsWith('s')) return canonical.slice(0, -1);

  return canonical;
}

function rawTokens(text) {
  return String(text || '').match(/[\p{L}\p{N}]+/gu) || [];
}

function tokenize(text) {
  return rawTokens(text)
    .map((word) => stem(normalize(word)))
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function isQuestion(text) {
  const normalized = normalize(text).trim();

  if (normalized.includes('?')) return true;

  const interrogativeOpening = /^(como|onde|quando|por que|qual|quais|quem)\b/.test(normalized);
  const doubtExpression = /\b(alguem sabe|nao entendi|tenho duvida|poderia explicar)\b/.test(
    normalized,
  );

  return interrogativeOpening || doubtExpression;
}

function countTerms(terms) {
  const counts = new Map();
  terms.forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
  return counts;
}

function buildDocuments(replies) {
  const displayTerms = new Map();
  const documents = replies.map((reply) => {
    const terms = tokenize(reply.body);
    const originalWords = rawTokens(reply.body);

    originalWords.forEach((word) => {
      const normalized = stem(normalize(word));
      if (!terms.includes(normalized)) return;
      if (!displayTerms.has(normalized)) displayTerms.set(normalized, word);
    });

    return {
      reply,
      terms,
      counts: countTerms(terms),
      question: isQuestion(reply.body),
    };
  });

  return { documents, displayTerms };
}

function documentFrequency(documents) {
  const frequencies = new Map();

  documents.forEach((document) => {
    new Set(document.terms).forEach((term) => {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    });
  });

  return frequencies;
}

function vectorize(document, frequencies, total) {
  const vector = new Map();

  document.counts.forEach((count, term) => {
    const inverseFrequency = Math.log((total + 1) / ((frequencies.get(term) || 0) + 1)) + 1;
    vector.set(term, (1 + Math.log(count)) * inverseFrequency);
  });

  return vector;
}

function cosine(left, right) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  left.forEach((weight, term) => {
    leftMagnitude += weight * weight;
    dot += weight * (right.get(term) || 0);
  });
  right.forEach((weight) => {
    rightMagnitude += weight * weight;
  });

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}

function find(parent, index) {
  if (parent[index] !== index) parent[index] = find(parent, parent[index]);
  return parent[index];
}

function union(parent, left, right) {
  const leftRoot = find(parent, left);
  const rightRoot = find(parent, right);
  if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
}

function clusterDocuments(documents, vectors) {
  const parent = documents.map((_, index) => index);

  for (let left = 0; left < documents.length; left += 1) {
    for (let right = left + 1; right < documents.length; right += 1) {
      const questionPair = documents[left].question && documents[right].question;
      const threshold = questionPair ? 0.24 : 0.31;
      if (cosine(vectors[left], vectors[right]) >= threshold) union(parent, left, right);
    }
  }

  const groups = new Map();
  documents.forEach((_, index) => {
    const root = find(parent, index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(index);
  });

  return [...groups.values()].filter(
    (indexes) => indexes.length >= 2 && indexes.some((index) => documents[index].question),
  );
}

function representativeIndex(indexes, documents, vectors) {
  return indexes
    .map((index) => ({
      index,
      questionBoost: documents[index].question ? 0.2 : 0,
      centrality: indexes.reduce((sum, other) => sum + cosine(vectors[index], vectors[other]), 0),
    }))
    .sort((left, right) => {
      return right.centrality + right.questionBoost - (left.centrality + left.questionBoost);
    })[0].index;
}

function clusterLabel(indexes, documents, vectors, displayTerms) {
  const scores = new Map();
  const occurrences = new Map();

  indexes.forEach((index) => {
    new Set(documents[index].terms).forEach((term) => {
      occurrences.set(term, (occurrences.get(term) || 0) + 1);
    });
    vectors[index].forEach((weight, term) => {
      scores.set(term, (scores.get(term) || 0) + weight);
    });
  });

  const sharedTerms = [...scores]
    .filter(([term]) => {
      return (occurrences.get(term) || 0) >= 2 && !GENERIC_QUESTION_WORDS.has(term);
    })
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([term]) => displayTerms.get(term) || term);

  if (sharedTerms.length) return sharedTerms.join(' · ');

  const fallback = documents[indexes[0]].terms
    .filter((term) => !GENERIC_QUESTION_WORDS.has(term))
    .slice(0, 2)
    .map((term) => displayTerms.get(term) || term);

  return fallback.join(' · ') || 'Dúvidas relacionadas';
}

function slug(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 34);
}

function buildReplyMap(replies) {
  const { documents, displayTerms } = buildDocuments(replies);
  const frequencies = documentFrequency(documents);
  const vectors = documents.map((document) => {
    return vectorize(document, frequencies, Math.max(documents.length, 1));
  });
  const groups = clusterDocuments(documents, vectors);
  const assignment = new Map();

  const clusters = groups
    .map((indexes, clusterIndex) => {
      const label = clusterLabel(indexes, documents, vectors, displayTerms);
      const representative = documents[representativeIndex(indexes, documents, vectors)].reply;
      const cluster = {
        id: `nucleo-${slug(label) || clusterIndex + 1}-${clusterIndex + 1}`,
        label,
        count: indexes.length,
        questionCount: indexes.filter((index) => documents[index].question).length,
        replyIds: indexes.map((index) => documents[index].reply.id),
        representativeQuestion: representative.body,
      };

      indexes.forEach((index) => assignment.set(index, cluster));
      return cluster;
    })
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  return {
    total: replies.length,
    questionCount: documents.filter((document) => document.question).length,
    clusters,
    replies: replies.map((reply, index) => {
      const cluster = assignment.get(index);
      return {
        ...reply,
        insight: {
          questionLike: documents[index].question,
          clusterId: cluster?.id || null,
          clusterLabel: cluster?.label || null,
          similarCount: cluster ? cluster.count - 1 : 0,
        },
      };
    }),
  };
}

function relatedScore(reference, candidate) {
  const referenceTerms = new Set(tokenize(`${reference.title} ${reference.body}`));
  const candidateTerms = new Set(tokenize(`${candidate.title} ${candidate.body}`));
  let overlap = 0;

  referenceTerms.forEach((term) => {
    if (candidateTerms.has(term)) overlap += 1;
  });

  if (!overlap) return 0;
  return overlap / Math.sqrt(referenceTerms.size * candidateTerms.size);
}

function rankRelatedDiscussions(reference, candidates, limit = 3) {
  return candidates
    .map((candidate) => ({ candidate, score: relatedScore(reference, candidate) }))
    .filter((item) => item.score >= 0.12)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.candidate);
}

module.exports = {
  buildReplyMap,
  isQuestion,
  rankRelatedDiscussions,
  tokenize,
};

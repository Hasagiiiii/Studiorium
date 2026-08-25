export type NewsSourceKind = 'official' | 'primary' | 'journalistic' | 'other';

export type NewsSourcePolicyInput = {
  sourceKind: NewsSourceKind;
  officialSourceAvailable: boolean;
  corroboratedByOfficialSource?: boolean;
};

export type NewsSourceDecision = {
  allowed: boolean;
  reason: 'official_source' | 'primary_source' | 'corroborated_secondary' | 'official_source_required';
};

export function decideNewsSource(input: NewsSourcePolicyInput): NewsSourceDecision {
  if (input.sourceKind === 'official') {
    return { allowed: true, reason: 'official_source' };
  }

  if (input.sourceKind === 'primary') {
    return { allowed: true, reason: 'primary_source' };
  }

  if (input.officialSourceAvailable && !input.corroboratedByOfficialSource) {
    return { allowed: false, reason: 'official_source_required' };
  }

  return { allowed: true, reason: 'corroborated_secondary' };
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function newsFingerprint(title: string, summary = ''): string {
  const tokens = normalize(`${title} ${summary}`)
    .split(' ')
    .filter((token) => token.length > 2)
    .slice(0, 40);

  return [...new Set(tokens)].sort().join('|');
}

export type NewsDeduplicationInput = {
  candidateFingerprint: string;
  existingFingerprints: string[];
  semanticSimilarity?: number;
  semanticThreshold?: number;
};

export type NewsDeduplicationDecision = {
  duplicate: boolean;
  reason: 'unique' | 'same_fingerprint' | 'same_meaning';
};

export function decideNewsDuplicate(input: NewsDeduplicationInput): NewsDeduplicationDecision {
  if (input.existingFingerprints.includes(input.candidateFingerprint)) {
    return { duplicate: true, reason: 'same_fingerprint' };
  }

  const threshold = input.semanticThreshold ?? 0.86;
  if (typeof input.semanticSimilarity === 'number' && input.semanticSimilarity >= threshold) {
    return { duplicate: true, reason: 'same_meaning' };
  }

  return { duplicate: false, reason: 'unique' };
}

export type EditorialTopic = 'sports' | 'education' | 'politics' | 'general';

export type EditorialAnalysisInput = {
  topic: EditorialTopic;
  officialFactsVerified: boolean;
  reactionSourceCount: number;
  distinctViewpointCount: number;
  supportsPartyOrCandidate?: boolean;
  clearlyLabeledAsAiAnalysis: boolean;
};

export type EditorialAnalysisDecision = {
  allowed: boolean;
  reason:
    | 'analysis_allowed'
    | 'facts_not_verified'
    | 'insufficient_reactions'
    | 'insufficient_viewpoints'
    | 'political_endorsement_not_allowed'
    | 'ai_label_required';
};

export function decideEditorialAnalysis(input: EditorialAnalysisInput): EditorialAnalysisDecision {
  if (!input.officialFactsVerified) {
    return { allowed: false, reason: 'facts_not_verified' };
  }

  if (!input.clearlyLabeledAsAiAnalysis) {
    return { allowed: false, reason: 'ai_label_required' };
  }

  if (input.reactionSourceCount < 3) {
    return { allowed: false, reason: 'insufficient_reactions' };
  }

  if (input.distinctViewpointCount < 2) {
    return { allowed: false, reason: 'insufficient_viewpoints' };
  }

  if (input.topic === 'politics' && input.supportsPartyOrCandidate) {
    return { allowed: false, reason: 'political_endorsement_not_allowed' };
  }

  return { allowed: true, reason: 'analysis_allowed' };
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideEditorialAnalysis,
  decideNewsDuplicate,
  decideNewsSource,
  newsFingerprint,
  selectMatchHighlights,
} from '../src/index.js';

test('requires official corroboration when an official source exists', () => {
  assert.deepEqual(
    decideNewsSource({
      sourceKind: 'journalistic',
      officialSourceAvailable: true,
      corroboratedByOfficialSource: false,
    }),
    { allowed: false, reason: 'official_source_required' },
  );
});

test('accepts official sources directly', () => {
  assert.equal(
    decideNewsSource({ sourceKind: 'official', officialSourceAvailable: true }).allowed,
    true,
  );
});

test('blocks exact and semantic duplicate news', () => {
  const fingerprint = newsFingerprint(
    'Flamengo vence por 2 a 0 no Brasileirão',
    'Equipe decidiu a partida no segundo tempo.',
  );

  assert.equal(
    decideNewsDuplicate({
      candidateFingerprint: fingerprint,
      existingFingerprints: [fingerprint],
    }).reason,
    'same_fingerprint',
  );

  assert.equal(
    decideNewsDuplicate({
      candidateFingerprint: 'outro',
      existingFingerprints: [],
      semanticSimilarity: 0.91,
    }).reason,
    'same_meaning',
  );
});

test('requires multiple reactions and viewpoints for AI editorial analysis', () => {
  assert.deepEqual(
    decideEditorialAnalysis({
      topic: 'sports',
      officialFactsVerified: true,
      reactionSourceCount: 2,
      distinctViewpointCount: 2,
      clearlyLabeledAsAiAnalysis: true,
    }),
    { allowed: false, reason: 'insufficient_reactions' },
  );
});

test('does not allow political endorsement in AI analysis', () => {
  assert.equal(
    decideEditorialAnalysis({
      topic: 'politics',
      officialFactsVerified: true,
      reactionSourceCount: 4,
      distinctViewpointCount: 3,
      clearlyLabeledAsAiAnalysis: true,
      supportsPartyOrCandidate: true,
    }).reason,
    'political_endorsement_not_allowed',
  );
});

test('match highlights prioritize decisive verified events', () => {
  const highlights = selectMatchHighlights([
    {
      kind: 'card',
      minute: 12,
      title: 'Cartão amarelo',
      description: 'Advertência no meio-campo.',
      officialFact: true,
    },
    {
      kind: 'goal',
      minute: 81,
      title: 'Gol da vitória',
      description: 'Finalização decidiu o jogo.',
      officialFact: true,
    },
    {
      kind: 'turning_point',
      minute: 65,
      title: 'Mudança da partida',
      description: 'A alteração tática mudou o controle do jogo.',
      officialFact: true,
    },
    {
      kind: 'big_chance',
      minute: 4,
      title: 'Boato de chance',
      description: 'Evento não confirmado pela fonte oficial.',
      officialFact: false,
    },
  ]);

  assert.deepEqual(
    highlights.map((highlight) => highlight.kind),
    ['goal', 'turning_point', 'card'],
  );
});

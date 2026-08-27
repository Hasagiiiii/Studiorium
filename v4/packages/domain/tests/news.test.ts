import assert from 'node:assert/strict';
import test from 'node:test';
import {
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

test('blocks exact duplicate news and accepts a distinct fingerprint', () => {
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

  assert.deepEqual(
    decideNewsDuplicate({
      candidateFingerprint: 'outro',
      existingFingerprints: [],
    }),
    { duplicate: false, reason: 'unique' },
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

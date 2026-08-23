import assert from 'node:assert/strict';
import test from 'node:test';
import type { FeedEntry } from '@lorion/contracts';
import { buildFeedFromSources, normalizeFeedMode, sortFeed } from '../src/index.js';

const recentDiscussion: FeedEntry = {
  type: 'discussion',
  at: '2026-08-23T04:00:00.000Z',
  item: {
    id: 'dis_1',
    authorId: 'usr_1',
    authorName: 'Ana',
    title: 'Discussão recente',
    body: 'Corpo',
    category: 'Geral',
    status: 'published',
    createdAt: '2026-08-23T04:00:00.000Z',
    updatedAt: '2026-08-23T04:00:00.000Z',
  },
};

const oldDiscussion: FeedEntry = {
  type: 'discussion',
  at: '2026-08-20T04:00:00.000Z',
  item: {
    id: 'dis_2',
    authorId: 'usr_2',
    authorName: 'Bia',
    title: 'Discussão antiga',
    body: 'Corpo',
    category: 'Geral',
    status: 'published',
    createdAt: '2026-08-20T04:00:00.000Z',
    updatedAt: '2026-08-20T04:00:00.000Z',
  },
};

test('modo inválido volta para para-você', () => {
  assert.equal(normalizeFeedMode('qualquer-coisa'), 'for-you');
});

test('feed recente ordena por data decrescente', () => {
  const sorted = sortFeed([oldDiscussion, recentDiscussion], 'recent');
  assert.equal(sorted[0]?.item.id, 'dis_1');
  assert.equal(sorted[1]?.item.id, 'dis_2');
});

test('fonte pública exclui projeto privado', () => {
  const feed = buildFeedFromSources({
    publications: [],
    discussions: [],
    news: [],
    projects: [
      {
        id: 'prj_private',
        ownerId: 'usr_1',
        title: 'Privado',
        type: 'Projeto',
        visibility: 'private',
        sections: [],
        notes: '',
        createdAt: '2026-08-23T01:00:00.000Z',
        updatedAt: '2026-08-23T01:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'prj_public',
        ownerId: 'usr_1',
        title: 'Público',
        type: 'Projeto',
        visibility: 'public',
        sections: [],
        notes: '',
        createdAt: '2026-08-23T02:00:00.000Z',
        updatedAt: '2026-08-23T02:00:00.000Z',
        deletedAt: null,
      },
    ],
  });

  assert.deepEqual(
    feed.map((entry) => entry.item.id),
    ['prj_public'],
  );
});

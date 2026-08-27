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
    replyCount: 0,
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
    replyCount: 0,
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

test('fonte do feed inclui post social e exclui projeto privado', () => {
  const feed = buildFeedFromSources({
    posts: [
      {
        id: 'pst_1',
        authorId: 'usr_2',
        authorUsername: 'bia',
        authorName: 'Bia',
        title: '',
        body: 'Uma atualização',
        media: [],
        interactions: {
          likeCount: 0,
          commentCount: 0,
          viewerLiked: false,
          canInteract: false,
        },
        community: null,
        visibility: 'public',
        moderationStatus: 'clear',
        createdAt: '2026-08-23T03:00:00.000Z',
        updatedAt: '2026-08-23T03:00:00.000Z',
      },
    ],
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
    ['pst_1', 'prj_public'],
  );
});

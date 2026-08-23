import assert from 'node:assert/strict';
import test from 'node:test';
import { decideCommentNotification } from '../src/index.js';

test('comentário de nível superior notifica o autor do conteúdo', () => {
  assert.deepEqual(
    decideCommentNotification({
      actorId: 'usr_actor',
      contentAuthorId: 'usr_author',
    }),
    { kind: 'comment', targetUserId: 'usr_author' },
  );
});

test('resposta notifica o autor do comentário pai', () => {
  assert.deepEqual(
    decideCommentNotification({
      actorId: 'usr_actor',
      contentAuthorId: 'usr_author',
      parentAuthorId: 'usr_parent',
    }),
    { kind: 'reply', targetUserId: 'usr_parent' },
  );
});

test('usuário não recebe notificação da própria ação', () => {
  assert.equal(
    decideCommentNotification({
      actorId: 'usr_actor',
      contentAuthorId: 'usr_actor',
    }),
    null,
  );

  assert.equal(
    decideCommentNotification({
      actorId: 'usr_actor',
      contentAuthorId: 'usr_author',
      parentAuthorId: 'usr_actor',
    }),
    null,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBootstrap, projectSchema, publicUserSchema } from '../src/index.js';

test('bootstrap aplica defaults seguros para payload vazio', () => {
  const payload = parseBootstrap({});

  assert.deepEqual(payload.publications, []);
  assert.deepEqual(payload.news, []);
  assert.deepEqual(payload.books, []);
  assert.deepEqual(payload.bookReviews, []);
  assert.deepEqual(payload.projects, []);
  assert.deepEqual(payload.discussions, []);
  assert.deepEqual(payload.profiles, []);
  assert.deepEqual(payload.communities, []);
  assert.equal(payload.settings.site_title, 'Lorion');
  assert.equal(payload.settings.registrations_open, true);
  assert.equal(payload.user, null);
});

test('usuário público rejeita e-mail inválido em runtime', () => {
  assert.throws(() =>
    publicUserSchema.parse({
      id: 'usr_1',
      displayName: 'Pessoa',
      email: 'nao-e-email',
    }),
  );
});

test('projeto v4 exige ownerId e não aceita o contrato legado userId sozinho', () => {
  assert.throws(() =>
    projectSchema.parse({
      id: 'prj_1',
      userId: 'usr_legado',
      title: 'Projeto legado',
      visibility: 'public',
      sections: [],
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    }),
  );
});

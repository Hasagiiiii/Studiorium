import assert from 'node:assert/strict';
import test from 'node:test';
import {
  communityMembershipRequestSchema,
  communityMembershipResultSchema,
  parseBootstrap,
  projectSchema,
  publicUserSchema,
} from '../src/index.js';

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
  assert.equal(payload.capabilities.passwordResetAvailable, false);
  assert.equal(payload.user, null);
});

test('bootstrap só habilita recuperação de senha quando o backend declara a capability', () => {
  const payload = parseBootstrap({
    capabilities: { passwordResetAvailable: true },
  });

  assert.equal(payload.capabilities.passwordResetAvailable, true);
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

test('participação em comunidade exige contagem válida e estado explícito', () => {
  const membership = communityMembershipResultSchema.parse({
    communityId: 'community_1',
    joined: true,
    membershipStatus: 'active',
    role: 'member',
    memberModerationStatus: 'clear',
    memberCount: 1,
  });

  assert.equal(membership.joined, true);
  assert.equal(membership.membershipStatus, 'active');
  assert.equal(membership.memberCount, 1);
  assert.throws(() =>
    communityMembershipResultSchema.parse({
      ...membership,
      memberCount: -1,
    }),
  );
});

test('solicitação de comunidade mantém identidade navegável e data opcional', () => {
  const request = communityMembershipRequestSchema.parse({
    userId: 'usr_1',
    username: 'pessoa',
    displayName: 'Pessoa',
    requestedAt: '2026-08-23T15:00:00.000Z',
  });

  assert.equal(request.username, 'pessoa');
  assert.equal(request.userId, 'usr_1');
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

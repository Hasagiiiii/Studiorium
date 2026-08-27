import assert from 'node:assert/strict';
import test from 'node:test';
import { communityCapabilities } from '../src/index.js';

test('visitante pode ler comunidade pública, mas não publicar ou moderar', () => {
  assert.deepEqual(communityCapabilities({ visibility: 'public' }), {
    canReadHub: true,
    canCreateDiscussion: false,
    canModerateMembershipRequests: false,
    canLeaveCommunity: false,
  });
});

test('membro ativo e regular pode acessar, publicar e sair', () => {
  assert.deepEqual(
    communityCapabilities({
      visibility: 'restricted',
      membershipStatus: 'active',
      moderationStatus: 'clear',
      role: 'member',
    }),
    {
      canReadHub: true,
      canCreateDiscussion: true,
      canModerateMembershipRequests: false,
      canLeaveCommunity: true,
    },
  );
});

test('moderador ativo pode gerenciar solicitações', () => {
  const capabilities = communityCapabilities({
    visibility: 'private',
    membershipStatus: 'active',
    moderationStatus: 'clear',
    role: 'moderator',
  });

  assert.equal(capabilities.canReadHub, true);
  assert.equal(capabilities.canModerateMembershipRequests, true);
});

test('líder pode moderar, mas não sair sem transferir liderança', () => {
  const capabilities = communityCapabilities({
    visibility: 'restricted',
    membershipStatus: 'active',
    moderationStatus: 'clear',
    role: 'leader',
  });

  assert.equal(capabilities.canModerateMembershipRequests, true);
  assert.equal(capabilities.canLeaveCommunity, false);
});

test('membro removido perde todas as capacidades de membro', () => {
  assert.deepEqual(
    communityCapabilities({
      visibility: 'restricted',
      membershipStatus: 'active',
      moderationStatus: 'removed',
      role: 'moderator',
    }),
    {
      canReadHub: false,
      canCreateDiscussion: false,
      canModerateMembershipRequests: false,
      canLeaveCommunity: false,
    },
  );
});

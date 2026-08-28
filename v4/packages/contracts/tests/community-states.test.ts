import assert from 'node:assert/strict';
import test from 'node:test';
import {
  communityMemberModerationStatusSchema,
  communityMemberRoleSchema,
  communityStatusSchema,
  communityVisibilitySchema,
} from '../src/index.js';

test('comunidades aceitam somente visibilidades persistidas', () => {
  assert.equal(communityVisibilitySchema.parse('public'), 'public');
  assert.equal(communityVisibilitySchema.parse('restricted'), 'restricted');
  assert.equal(communityVisibilitySchema.parse('private'), 'private');
  assert.throws(() => communityVisibilitySchema.parse('friends'));
});

test('comunidades aceitam somente estados persistidos', () => {
  assert.equal(communityStatusSchema.parse('active'), 'active');
  assert.equal(communityStatusSchema.parse('archived'), 'archived');
  assert.throws(() => communityStatusSchema.parse('disabled'));
});

test('papéis e moderação de membros seguem o contrato do banco', () => {
  for (const role of ['member', 'moderator', 'curator', 'leader']) {
    assert.equal(communityMemberRoleSchema.parse(role), role);
  }
  for (const status of ['clear', 'muted', 'removed']) {
    assert.equal(communityMemberModerationStatusSchema.parse(status), status);
  }
  assert.equal(communityMemberModerationStatusSchema.parse(null), null);
  assert.throws(() => communityMemberRoleSchema.parse('admin'));
  assert.throws(() => communityMemberModerationStatusSchema.parse('blocked'));
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const {
  legacyAuthorization,
  effectiveRoleIds,
} = require('../src/server/authorization');

test('RBAC mantém o cargo nativo atual como autoridade durante a migração', () => {
  const roles = effectiveRoleIds(
    { id: 'u1', role: 'user' },
    [{ role_id: 'admin' }, { role_id: 'research_reviewer' }],
  );
  assert.deepEqual(roles, ['user', 'research_reviewer']);
});

test('fallback legado preserva permissões administrativas enquanto o schema novo não existe', () => {
  const authorization = legacyAuthorization({ id: 'u1', role: 'admin' });
  assert.ok(authorization.permissions.includes('admin.full'));
  assert.ok(authorization.permissions.includes('roles.manage'));
});

test('migração v3.5 é aditiva e cria a fundação de governança', () => {
  const sql = readFileSync(
    join(__dirname, '..', 'supabase', 'upgrade-v3.5-data-architecture.sql'),
    'utf8',
  );

  assert.match(sql, /create table if not exists public\.roles/i);
  assert.match(sql, /create table if not exists public\.permissions/i);
  assert.match(sql, /create table if not exists public\.user_roles/i);
  assert.match(sql, /publications add column if not exists deleted_at/i);
  assert.match(
    sql,
    /revoke all on table public\.user_roles from public, anon, authenticated/i,
  );
  assert.match(sql, /communities_created_by_idx/i);
  assert.match(sql, /community_content_links_moderated_by_idx/i);
  assert.doesNotMatch(sql, /drop table/i);
});

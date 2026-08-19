const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v3.2.2 alinha a matéria institucional à triagem automática local', () => {
  const migration = read('supabase/upgrade-v3.2.2-editorial-copy.sql');
  assert.ok(migration.includes("where id = 'news-redacao-studiorium'"));
  assert.ok(migration.includes('triagem automática local'));
  assert.ok(migration.includes('revisão editorial humana'));
  assert.equal(migration.includes('triagem por IA'), false);
  assert.equal(migration.includes('A IA auxilia'), false);
});

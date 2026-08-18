const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }

test('painel ADM possui rotas protegidas e áreas principais', () => {
  const router = read('src/server/router.js');
  const admin = read('src/server/routes/admin.js');
  for (const route of ['/admin/dashboard','/admin/settings']) assert.ok(router.includes(route));
  for (const capability of ['updateUser','updateTemplate','updateContent','updateSettings']) assert.ok(admin.includes(`function ${capability}`));
  assert.ok(admin.includes('requireAdmin'));
});

test('schema v2.2 preserva dados e adiciona controles administrativos', () => {
  const schema = read('supabase/schema.sql');
  for (const marker of ['status text not null default \'active\'','site_settings','admin_audit_log','featured boolean not null default false']) assert.ok(schema.includes(marker));
  assert.ok(fs.existsSync(path.join(root, 'supabase/upgrade-v2.2-admin.sql')));
});

test('interface ADM expõe usuários, publicações, colóquio, acervo, configurações e registro', () => {
  const views = read('public/js/views.js') + read('public/js/views/admin.js');
  for (const label of ['Usuários','Publicações','Colóquio','Acervo','Configurações','Registro']) assert.ok(views.includes(label));
  assert.ok(views.includes("adminPanel(tab='overview')"));
});

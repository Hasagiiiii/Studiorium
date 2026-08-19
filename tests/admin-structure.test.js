const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('painel ADM possui rotas protegidas e áreas principais', () => {
  const router = read('src/server/router.js');
  const admin = read('src/server/routes/admin.js');
  for (const route of ['/admin/dashboard', '/admin/settings']) assert.ok(router.includes(route));
  for (const capability of ['updateUser', 'updateTemplate', 'updateContent', 'updateSettings'])
    assert.ok(admin.includes(`function ${capability}`));
  assert.ok(admin.includes('requireAdmin'));
});

test('schema v2.2 preserva dados e adiciona controles administrativos', () => {
  const schema = read('supabase/schema.sql');
  for (const marker of [
    "status text not null default 'active'",
    'site_settings',
    'admin_audit_log',
    'featured boolean not null default false',
  ])
    assert.ok(schema.includes(marker));
  assert.ok(fs.existsSync(path.join(root, 'supabase/upgrade-v2.2-admin.sql')));
});

test('interface ADM expõe todas as filas e áreas administrativas', () => {
  const views = read('public/js/views.js') + read('public/js/views/admin.js');
  for (const label of [
    'Usuários',
    'Publicações',
    'Oficina',
    'Colóquio',
    'Acervo',
    'Configurações',
    'Registro',
  ])
    assert.ok(views.includes(label));
  assert.match(views, /function adminPanel\(tab\s*=\s*['"]overview['"]\)/);
});

test('conteúdo da Oficina aparece para o autor e na revisão administrativa', () => {
  const adminRoute = read('src/server/routes/admin.js');
  const router = read('src/server/router.js');
  const dashboard = read('src/server/routes/bootstrap.js');
  const workspace = read('public/js/views/workspace.js');

  assert.ok(adminRoute.includes(".from('tech_resources')"));
  assert.ok(adminRoute.includes('pendingTechResources'));
  assert.ok(adminRoute.includes('techResources: techResourcesQ.data.map(S.techResource)'));
  assert.ok(router.includes('publication|tech_resource|discussion|reply'));
  assert.ok(dashboard.includes('techResources: techQ.data.map(S.techResource)'));
  assert.ok(workspace.includes('Seus tutoriais e projetos enviados'));
});

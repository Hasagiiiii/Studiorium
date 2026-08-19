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

test('atalho da Escrivaninha abre o formulário da Oficina com opção de cancelar', () => {
  const workspace = read('public/js/views/workspace.js');
  const techView = read('public/js/views/tech.js');
  const composer = read('public/js/events/composers.js');
  const events = read('public/js/events/community.js');

  assert.ok(workspace.includes('/oficina?novo=1'));
  assert.ok(techView.includes("state.query.get('novo') === '1'"));
  assert.ok(composer.includes('Limpar formulário'));
  assert.ok(composer.includes('data-cancel-tech'));
  assert.ok(events.includes('composer.replaceChildren()'));
});

test('envios não aprovados podem ser editados, reenviados ou apagados pelo proprietário', () => {
  const router = read('src/server/router.js');
  const techRoute = read('src/server/routes/tech.js');
  const publicationRoute = read('src/server/routes/publications.js');
  const workspace = read('public/js/views/workspace.js');
  const events = read('public/js/events/community.js');

  for (const capability of ['getMine', 'update', 'remove']) {
    assert.ok(techRoute.includes(`function ${capability}`));
  }
  for (const capability of ['getPublication', 'updatePublication', 'deletePublication']) {
    assert.ok(publicationRoute.includes(`function ${capability}`));
  }
  assert.ok(techRoute.includes(".eq('owner_id', user.id)"));
  assert.ok(publicationRoute.includes(".eq('owner_id', user.id)"));
  assert.ok(router.includes("method === 'DELETE'"));
  assert.ok(workspace.includes('Editar e reenviar'));
  assert.ok(workspace.includes('Apagar definitivamente'));
  assert.ok(events.includes("method: resourceId ? 'PATCH' : 'POST'"));
  assert.ok(events.includes("method: publicationId ? 'PATCH' : 'POST'"));
});

test('ADM pode corrigir ou apagar definitivamente conteúdo ainda não publicado', () => {
  const routes = read('src/server/routes/admin.js');
  const view = read('public/js/views/admin.js');
  const events = read('public/js/events/admin.js');

  assert.ok(routes.includes('function updateContentDetails'));
  assert.ok(routes.includes('function deleteContent'));
  assert.ok(routes.includes("current.status === 'published'"));
  assert.ok(view.includes('data-admin-edit-content'));
  assert.ok(view.includes('data-admin-delete-content'));
  assert.ok(events.includes('/details'));
  assert.ok(events.includes("method: 'DELETE'"));
});

test('telas privadas usam o aviso de login compartilhado sem referência ausente', () => {
  const core = read('public/js/views/core.js');
  const workspace = read('public/js/views/workspace.js');
  const aggregate = read('public/js/views.js');

  assert.ok(core.includes('function requireLogin'));
  assert.ok(workspace.includes('requireLogin,'));
  assert.ok(aggregate.includes('requireLogin,'));
});

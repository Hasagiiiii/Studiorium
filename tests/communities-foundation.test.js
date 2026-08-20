const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Comunidades possui modelo relacional próprio sem duplicar conteúdos', () => {
  const migration = read('supabase/upgrade-v3.4-communities.sql');
  assert.match(migration, /create table if not exists public\.communities/);
  assert.match(migration, /create table if not exists public\.community_members/);
  assert.match(migration, /create table if not exists public\.community_content_links/);
  assert.match(migration, /content_type in \(/);
  assert.doesNotMatch(migration, /create table if not exists public\.community_posts/);
  assert.match(migration, /enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.community_members from public, anon, authenticated/,
  );
});

test('catálogo oficial começa controlado e tutorial não vira comunidade isolada', () => {
  const catalog = read('src/server/community-catalog.js');
  for (const slug of [
    'pc-hardware',
    'programacao',
    'motos',
    'carros',
    'matematica',
    'pesquisa-cientifica',
    'design-templates',
    'literatura',
  ]) {
    assert.match(catalog, new RegExp(`slug: '${slug}'`));
  }
  assert.doesNotMatch(catalog, /slug: 'tutoriais'/);
});

test('Colóquio pode ser vinculado a uma comunidade sem mudar tabela de discussões', () => {
  const discussions = read('src/server/routes/discussions.js');
  const links = read('src/server/community-links.js');
  assert.match(discussions, /communitySlug/);
  assert.match(discussions, /setContentCommunity\('discussion'/);
  assert.match(discussions, /removeContentCommunity\('discussion'/);
  assert.match(links, /community_content_links/);
});

test('papéis locais limitam poderes à comunidade e líder não equivale a ADM', () => {
  const permissions = read('src/server/community-permissions.js');
  const routes = read('src/server/routes/communities.js');
  const router = read('src/server/router.js');
  const migration = read('supabase/upgrade-v3.4-communities.sql');

  assert.match(migration, /'member', 'moderator', 'curator', 'leader'/);
  assert.match(permissions, /leader:/);
  assert.match(permissions, /manage_roles/);
  assert.match(permissions, /manage_rules/);
  assert.match(routes, /Somente a administração do Studiorium pode alterar outro líder/);
  assert.match(routes, /\['member', 'moderator', 'curator'\]/);
  assert.match(router, /communityRoutes\.members/);
  assert.match(router, /communityRoutes\.updateMember/);
  assert.match(router, /communityRoutes\.updateCommunity/);
});

test('interface oferece gestão local apenas quando a API entrega permissões', () => {
  const view = read('public/js/views/communities.js');
  const events = read('public/js/events/communities.js');

  assert.match(view, /data-community-manage/);
  assert.match(view, /manage_roles/);
  assert.match(view, /manage_rules/);
  assert.match(events, /data-community-member-form/);
  assert.match(events, /data-community-rules-form/);
  assert.match(events, /Somente o ADM pode criar ou substituir outro Líder/);
});

test('rotas públicas de Comunidades coexistem com compatibilidade do Colóquio antigo', () => {
  const serverRouter = read('src/server/router.js');
  const clientRouter = read('public/js/router.js');

  assert.match(serverRouter, /pathname === '\/communities'/);
  assert.match(serverRouter, /communityRoutes\.detail/);
  assert.match(clientRouter, /p === '\/comunidades'/);
  assert.match(clientRouter, /history\.replaceState\(\{\}, '', '\/comunidades'\)/);
  assert.match(clientRouter, /\/comunidades\\\/\(\[\^\/\]\+\)\\\/coloquio/);
  assert.match(clientRouter, /p\.startsWith\('\/coloquio\/'\)/);
});

test('interface de Comunidades possui reflow 3, 2 e 1 colunas sem escala artificial', () => {
  const css = read('public/css/communities.css');
  assert.match(css, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /community-member-row/);
  assert.doesNotMatch(css, /\bzoom\s*:/);
  assert.doesNotMatch(css, /transform:\s*scale/);
});

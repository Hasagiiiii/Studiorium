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
  assert.match(migration, /create unique index if not exists community_content_single_parent_idx/);
  assert.doesNotMatch(migration, /create table if not exists public\.community_posts/);
  assert.match(migration, /enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.community_members from public, anon, authenticated/,
  );
});

test('participação voluntária e moderação local são estados distintos', () => {
  const migration = read('supabase/upgrade-v3.4-communities.sql');
  const permissions = read('src/server/community-permissions.js');
  const routes = read('src/server/routes/communities.js');

  assert.match(migration, /status in \('active', 'left'\)/);
  assert.match(migration, /moderation_status in \('clear', 'muted', 'removed'\)/);
  assert.match(permissions, /membership\?\.status === 'active'/);
  assert.match(permissions, /membership\?\.moderation_status === 'clear'/);
  assert.match(routes, /moderation_status === 'removed'/);
  assert.match(routes, /status: 'left'/);
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

test('Colóquio usa vínculo comunitário e exige participação ativa', () => {
  const discussions = read('src/server/routes/discussions.js');
  const links = read('src/server/community-links.js');

  assert.match(discussions, /communitySlug/);
  assert.match(discussions, /setContentCommunity\('discussion'/);
  assert.match(discussions, /removeContentCommunity\('discussion'/);
  assert.match(discussions, /requireCommunityPermission/);
  assert.match(discussions, /'participate'/);
  assert.match(discussions, /requireDiscussionCommunityAccess/);
  assert.match(links, /community_content_links/);
});

test('discussões ocultas não vazam no bootstrap nem em conversas relacionadas', () => {
  const discussions = read('src/server/routes/discussions.js');
  const bootstrap = read('src/server/routes/bootstrap.js');
  const links = read('src/server/community-links.js');

  assert.match(links, /hiddenCommunityContentIds/);
  assert.match(bootstrap, /hiddenCommunityContentIds\('discussion'\)/);
  assert.match(bootstrap, /publicDiscussions/);
  assert.match(discussions, /hiddenCommunityContentIds\('discussion'\)/);
  assert.match(discussions, /visibleRelated/);
  assert.match(discussions, /communityPermissions/);
});

test('Oficina pode pertencer à comunidade sem duplicar o conteúdo', () => {
  const tech = read('src/server/routes/tech.js');
  const composer = read('public/js/events/composers.js');

  assert.match(tech, /setContentCommunity\('tech_resource'/);
  assert.match(tech, /removeContentCommunity\('tech_resource'/);
  assert.match(tech, /communityForContent\('tech_resource'/);
  assert.match(tech, /requireCommunityPermission/);
  assert.match(composer, /name="communitySlug"/);
  assert.match(composer, /query\.get\('comunidade'\)/);
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

test('moderação local oculta vínculo sem apagar conteúdo global da Oficina', () => {
  const migration = read('supabase/upgrade-v3.4-communities.sql');
  const routes = read('src/server/routes/communities.js');
  const events = read('public/js/events/communities.js');
  const views = read('public/js/views/communities.js');

  assert.match(migration, /status in \('visible', 'hidden'\)/);
  assert.match(routes, /moderateContent/);
  assert.match(routes, /moderated_by/);
  assert.match(events, /data-community-content-status/);
  assert.match(views, /Ocultar da comunidade/);
  assert.match(views, /Restaurar na comunidade/);
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

test('navegação usa Comunidades e mantém Colóquio antigo apenas por compatibilidade', () => {
  const serverRouter = read('src/server/router.js');
  const clientRouter = read('public/js/router.js');
  const core = read('public/js/views/core.js');

  assert.match(serverRouter, /pathname === '\/communities'/);
  assert.match(serverRouter, /communityRoutes\.detail/);
  assert.match(clientRouter, /p === '\/comunidades'/);
  assert.match(clientRouter, /history\.replaceState\(\{\}, '', '\/comunidades'\)/);
  assert.match(clientRouter, /communityThread/);
  assert.match(clientRouter, /p\.startsWith\('\/coloquio\/'\)/);
  assert.match(core, /\['\/comunidades', 'Comunidades'\]/);
  assert.doesNotMatch(core, /\['\/coloquio', 'Colóquio'\]/);
});

test('interface de Comunidades possui reflow 3, 2 e 1 colunas sem escala artificial', () => {
  const css = read('public/css/communities.css');
  assert.match(css, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /community-member-row/);
  assert.match(css, /community-discussion-item/);
  assert.doesNotMatch(css, /\bzoom\s*:/);
  assert.doesNotMatch(css, /transform:\s*scale/);
});

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const read = (path) => readFileSync(path, 'utf8');

const migration = read('supabase/upgrade-v3.6-social-graph.sql');
const socialRoutes = read('src/server/routes/social.js');
const socialRouter = read('src/server/social-router.js');
const apiEntry = read('api/index.js');
const runtime = read('public/js/runtime.js');
const events = read('public/js/events/social.js');
const eventDispatcher = read('public/js/events.js');
const profile = read('public/js/views/profile-social.js');
const feed = read('public/js/views/home-social-feed.js');
const home = read('public/js/views/home-social.js');
const css = read('public/css/social-graph.css');
const style = read('public/style.css');

test('grafo de seguidores tem integridade e não fica exposto ao navegador', () => {
  assert.match(migration, /create table if not exists public\.user_follows/);
  assert.match(migration, /primary key \(follower_id, followed_id\)/);
  assert.match(migration, /check \(follower_id <> followed_id\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.user_follows from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.user_follows to service_role/);
});

test('API social exige sessão para escrita, impede auto-follow e mantém follow idempotente', () => {
  assert.match(socialRoutes, /await requireUser\(req\)/);
  assert.match(socialRoutes, /target\.user_id === user\.id/);
  assert.match(socialRoutes, /error\.code !== '23505'/);
  assert.match(socialRoutes, /type: 'social\.follow'/);
  assert.match(socialRouter, /assertSameOrigin\(req\)/);
  assert.match(socialRouter, /method === 'POST'/);
  assert.match(socialRouter, /method === 'DELETE'/);
  assert.match(apiEntry, /handleSocial/);
});

test('runtime carrega relações atuais sem tornar falha social fatal para o bootstrap', () => {
  assert.match(runtime, /social: \{ followingIds: \[\] \}/);
  assert.match(runtime, /Promise\.allSettled/);
  assert.match(runtime, /api\('\/api\/social\/me'\)/);
  assert.match(runtime, /Array\.isArray\(data\.followingIds\)/);
});

test('perfil público oferece seguir e mostra seguidores e seguindo', () => {
  assert.match(profile, /async function socialSummary/);
  assert.match(profile, /\/api\/profiles\/\$\{encodeURIComponent\(profile\.username\)\}\/social/);
  assert.match(profile, /data-profile-follow=/);
  assert.match(profile, /data-following=/);
  assert.match(profile, />Seguidores</);
  assert.match(profile, />Seguindo</);
  assert.match(profile, /async function authorDetail/);
});

test('handler social alterna follow e atualiza estado antes de renderizar', () => {
  assert.match(events, /data-profile-follow/);
  assert.match(events, /method: following \? 'DELETE' : 'POST'/);
  assert.match(events, /await loadSocialGraph\(\)/);
  assert.match(events, /await render\(\)/);
  assert.match(eventDispatcher, /handleSocialClick/);
});

test('feed Seguindo usa somente autores presentes no grafo carregado', () => {
  assert.match(feed, /'following'/);
  assert.match(feed, /new Set\(state\.social\?\.followingIds \|\| \[\]\)/);
  assert.match(feed, /\.filter\(\(entry\) => following\.has\(ownerId\(entry\)\)\)/);
  assert.match(home, /tab\('following', 'Seguindo'\)/);
  assert.match(home, /Encontrar pessoas/);
});

test('contadores sociais se adaptam a desktop, tablet e celular', () => {
  assert.match(style, /css\/social-graph\.css/);
  assert.match(css, /repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /nth-child\(n \+ 3\)/);
});

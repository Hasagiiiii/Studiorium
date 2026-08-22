const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('destaque de notícias combina decisão editorial e Hype comunitário', () => {
  const migration = read('supabase/upgrade-v3.2.9-news-hype.sql');
  const news = read('src/server/routes/news.js');
  const bootstrap = read('src/server/routes/bootstrap.js');
  const serializer = read('src/server/serializers.js');

  assert.match(migration, /create table if not exists public\.news_hypes/i);
  assert.match(migration, /primary key \(article_id, user_id\)/i);
  assert.match(migration, /contributor_id <> p_user_id/i);
  assert.match(news, /Você não pode dar hype na própria notícia/);
  assert.match(news, /Você já deu hype nesta notícia/);
  assert.match(bootstrap, /order\('featured', \{ ascending: false \}\)[\s\S]*order\('hypes'/);
  assert.match(serializer, /hypes: Number\(row\.hypes \|\| 0\)/);
});

test('autor administra apenas conteúdo próprio e edição publicada volta para revisão quando necessário', () => {
  const publications = read('src/server/routes/publications.js');
  const tech = read('src/server/routes/tech.js');
  const news = read('src/server/routes/news.js');
  const discussions = read('src/server/routes/discussions.js');

  assert.match(publications, /\.eq\('owner_id', user\.id\)/);
  assert.match(publications, /status: 'pending_review'/);
  assert.match(publications, /O trabalho saiu do ar e voltou para revisão/);
  assert.match(tech, /editableStatuses = new Set\([^)]*'published'/s);
  assert.match(tech, /\.eq\('owner_id', user\.id\)/);
  assert.match(news, /\.eq\('contributor_id', user\.id\)/);
  assert.match(news, /precisa ser certificada novamente/);
  assert.match(discussions, /\.eq\('author_id', userId\)/);
  assert.match(discussions, /updateDiscussion/);
  assert.match(discussions, /updateReply/);
  assert.match(discussions, /deleteDiscussion/);
  assert.match(discussions, /deleteReply/);
});

test('ADM tem edição e exclusão global sem conceder esses poderes à moderação comum', () => {
  const admin = read('src/server/routes/admin.js');
  const adminNews = read('src/server/routes/admin-news.js');
  const router = read('src/server/router.js');
  const ui = read('public/js/admin-published-actions.js');

  assert.match(admin, /async function updateContentDetails[\s\S]*requireAdmin\(req\)/);
  assert.match(admin, /async function deleteContent[\s\S]*requireAdmin\(req\)/);
  assert.match(admin, /discussion:[\s\S]*table: 'discussions'/);
  assert.match(admin, /reply:[\s\S]*table: 'replies'/);
  assert.match(adminNews, /async function updateArticle[\s\S]*requireAdmin\(req\)/);
  assert.match(adminNews, /body\.action === 'edit'/);
  assert.match(router, /publication\|tech_resource\|discussion\|reply/);
  assert.match(ui, /data-admin-edit-content="discussion:/);
  assert.match(ui, /data-admin-edit-content="reply:/);
  assert.match(ui, /data-admin-delete-content/);
});

test('conteúdos já públicos ficam recolhidos nas áreas privadas sem redefinir o layout global', () => {
  const workspace = read('public/js/views/workspace-personal-v329.js');
  const workspaceTemplates = read('public/js/views/workspace-personal-v330.js');

  for (const label of [
    'Projetos públicos',
    'Publicadas',
    'Publicados',
    'Código público',
    'Discussões publicadas',
    'Respostas publicadas',
  ]) {
    assert.match(workspace, new RegExp(label));
  }
  assert.match(workspaceTemplates, /Seus templates/);
  assert.match(workspaceTemplates, /Publicados \(\$\{published\.length\}\)/);
  assert.match(workspaceTemplates, /data-workspace-templates/);
  assert.match(workspace, /workspace-published-vault/);
  assert.doesNotMatch(workspace, /grid-template-columns/);
  assert.doesNotMatch(workspaceTemplates, /grid-template-columns/);
});

test('roteador expõe gestão própria de discussões e respostas e área privada recebe os registros', () => {
  const router = read('src/server/router.js');
  const bootstrap = read('src/server/routes/bootstrap.js');
  const events = read('public/js/events/owned-content-v329.js');

  assert.match(router, /updateDiscussion/);
  assert.match(router, /deleteDiscussion/);
  assert.match(router, /updateReply/);
  assert.match(router, /deleteReply/);
  assert.match(bootstrap, /discussions: discussionsQ\.data\.map\(S\.discussion\)/);
  assert.match(bootstrap, /replies: repliesQ\.data\.map\(S\.reply\)/);
  assert.match(events, /data-edit-own-discussion|editOwnDiscussion/);
  assert.match(events, /data-delete-own-reply|deleteOwnReply/);
  assert.match(events, /confirmAction/);
});

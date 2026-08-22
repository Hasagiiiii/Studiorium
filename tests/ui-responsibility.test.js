const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Biblioteca é o único índice de pesquisas', () => {
  const router = read('public/js/router.js');
  assert.match(router, /p === '\/pesquisas'[\s\S]*\/biblioteca\?tipo=pesquisas/);
  assert.match(router, /p\.startsWith\('\/pesquisas\/'\)[\s\S]*researchDetail/);
});

test('Comunidade de Criação é o único hub de modelos e criação', () => {
  const router = read('public/js/router.js');
  const communities = read('public/js/views/communities.js');
  const studioEvents = read('public/js/events/template-studio.js');
  const socialWidgets = read('public/js/views/home-social-widgets.js');

  assert.match(router, /\['\/acervo', '\/explorar', '\/templates'\]/);
  assert.match(router, /p === '\/estudio-templates'[\s\S]*\/comunidades\/design-templates/);
  assert.match(communities, /function creationCommunityHub/);
  assert.match(communities, /Este é o único hub de criação do Studiorium/);
  assert.match(communities, /data-new-custom-template/);
  assert.match(communities, /data-import-template/);
  assert.match(studioEvents, /goto\('\/comunidades\/design-templates'\)/);
  assert.doesNotMatch(socialWidgets, /link\('\/estudio-templates', 'Criar/);
});

test('Colóquio de comunidade usa rota canônica contextual', () => {
  const router = read('public/js/router.js');
  const communities = read('public/js/views/communities.js');
  const home = read('public/js/views/home-social.js');

  assert.match(router, /p === '\/coloquio' \|\| p === '\/comunidade'[\s\S]*\/comunidades/);
  assert.match(communities, /`\/comunidades\/\$\{encodeURIComponent\(community\.slug\)\}\/coloquio`/);
  assert.doesNotMatch(home, /link\('\/coloquio', '◌ Discussões'/);
});

test('ferramentas continuam acessíveis sem virarem hubs paralelos', () => {
  const router = read('public/js/router.js');
  assert.match(router, /p\.startsWith\('\/estudio-templates\/'\)[\s\S]*templateEditor/);
  assert.match(router, /p === '\/laboratorio'[\s\S]*laboratorio/);
  assert.match(router, /\['\/atelie', '\/banner-cientifico'\]/);
  assert.match(router, /p === '\/redacao'[\s\S]*redacao/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('navegação pública trata criação como comunidade, sem catálogo separado', () => {
  const core = read('public/js/views/core.js');

  assert.match(core, /CREATION_COMMUNITY_PATH = '\/comunidades\/design-templates'/);
  assert.match(core, /\[CREATION_COMMUNITY_PATH, 'Criação'\]/);
  assert.match(core, /Comunidade de Criação/);
  assert.doesNotMatch(core, /\['\/acervo', 'Acervo'\]/);
  assert.doesNotMatch(core, /link\('\/acervo', 'Acervo'\)/);
});

test('rotas antigas do catálogo preservam compatibilidade e convergem para criação', () => {
  const router = read('public/js/router.js');

  assert.match(router, /\['\/acervo', '\/explorar', '\/templates'\]/);
  assert.match(router, /history\.replaceState\(\{\}, '', CREATION_COMMUNITY_PATH\)/);
  assert.match(router, /comunidadeDetalhe\('design-templates'\)/);
  assert.match(router, /p\.startsWith\('\/templates\/'\)/);
  assert.doesNotMatch(router, /return acervo\(\)/);
});

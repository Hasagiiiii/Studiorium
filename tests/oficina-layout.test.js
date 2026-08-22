const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Oficina não herda o grid de busca da Biblioteca', () => {
  const view = read('public/js/views/tech.js');
  const css = read('public/css/tech-polish.css');
  const style = read('public/style.css');

  assert.ok(style.includes("@import url('/css/tech-polish.css');"));
  assert.ok(view.includes('class="tech-search"'));
  assert.equal(view.includes('class="library-search"'), false);
  assert.ok(css.includes('.tech-search'));
  assert.ok(css.includes('grid-template-columns: minmax(0, 1fr) auto'));
  assert.ok(css.includes('.tech-search .field'));
  assert.ok(css.includes('.tech-search .solid'));
  assert.equal(css.includes('[data-tech-filter] .library-search'), false);
});

test('cards técnicos não repetem visualmente o nome do núcleo', () => {
  const css = read('public/css/tech-polish.css');
  assert.ok(css.includes('.tech-hub > .eyebrow'));
  assert.ok(css.includes('display: none'));
});

test('Oficina preserva respiro antes do cabeçalho da comunidade', () => {
  const css = read('public/css/tech-polish.css');
  assert.ok(css.includes('[data-tech-filter] ~ .sectionhead'));
  assert.ok(css.includes('margin-top: clamp(34px, 5vw, 52px)'));
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');

const catalog = read('public/js/book-catalog-v331.js');
const detail = read('public/js/views/books-v331.js');
const router = read('public/js/router.js');
const main = read('public/js/main.js');
const css = read('public/css/book-catalog-v331.css');
const style = read('public/style.css');

test('estante transforma cards longos em itens compactos clicáveis', () => {
  assert.match(catalog, /class="book-shelf-item"/);
  assert.match(catalog, /href="\/livros\/\$\{encodeURIComponent\(book\.id\)\}"/);
  assert.match(catalog, /shelf\.innerHTML = books\.map\(compactBookCard\)\.join\(''\)/);
  assert.doesNotMatch(catalog, /book\.description/);
  assert.doesNotMatch(catalog, /data-book-review-open/);
});

test('livro possui página própria com resumo reviews e ações de leitura', () => {
  for (const marker of [
    'book-detail-layout',
    'book-detail-description',
    'Reviews da comunidade',
    'data-book-save',
    'data-book-review-open',
    'data-book-review-save',
    'Voltar à estante',
  ]) {
    assert.ok(detail.includes(marker), `detalhe do livro ausente: ${marker}`);
  }
  assert.match(router, /p\.startsWith\('\/livros\/'\)/);
});

test('catálogo é instalado sem substituir melhorias existentes', () => {
  assert.ok(main.includes("import { installBookCatalog } from './book-catalog-v331.js';"));
  assert.ok(main.includes('installEnhancements();'));
  assert.ok(main.includes('installLibraryPolish();'));
  assert.ok(main.includes('installBookCatalog();'));
});

test('layout da estante é compacto e responsivo sem ocupar a largura toda', () => {
  assert.match(css, /repeat\(auto-fill, minmax\(140px, 182px\)\)/);
  assert.match(css, /aspect-ratio: 2 \/ 3/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
});

test('nova camada não ultrapassa o hardening global', () => {
  const catalogIndex = style.indexOf("@import url('/css/book-catalog-v331.css');");
  const hardeningIndex = style.indexOf("@import url('/css/layout-hardening-v328.css');");
  assert.ok(catalogIndex >= 0);
  assert.ok(hardeningIndex > catalogIndex);
  assert.equal(style.trim().split('\n').at(-1), "@import url('/css/layout-hardening-v328.css');");
});

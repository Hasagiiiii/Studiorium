const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');

const catalog = read('public/js/book-catalog.js');
const armarium = read('public/js/features/armarium.js');
const detail = read('public/js/views/books.js');
const router = read('public/js/router.js');
const main = read('public/js/main.js');
const css = read('public/css/book-catalog.css');
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

test('catálogo roda antes do Armarium e o texto final nasce no componente', () => {
  assert.ok(main.includes("import { installBookCatalog } from './book-catalog.js';"));
  assert.ok(main.includes('installEnhancements();'));
  assert.ok(main.includes('installBookCatalog();'));
  assert.ok(main.indexOf('installBookCatalog();') < main.indexOf('installEnhancements();'));
  assert.doesNotMatch(main, /LibraryPolish|library-polish/);
  assert.match(armarium, /<h2>Leituras da comunidade<\/h2>/);
  assert.match(armarium, /<summary>Adicionar livro lido<\/summary>/);
});

test('catálogo reage ao ciclo de render sem observar toda a árvore do app', () => {
  assert.match(catalog, /studiorium:rendered/);
  assert.doesNotMatch(catalog, /MutationObserver/);
});

test('layout da estante é compacto e responsivo sem ocupar a largura toda', () => {
  assert.match(css, /repeat\(auto-fill, minmax\(140px, 182px\)\)/);
  assert.match(css, /aspect-ratio: 2 \/ 3/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
});

test('nova camada não ultrapassa o hardening global', () => {
  const catalogIndex = style.indexOf("@import url('/css/book-catalog.css');");
  const hardeningIndex = style.indexOf("@import url('/css/responsive/hardening.css');");
  assert.ok(catalogIndex >= 0);
  assert.ok(hardeningIndex > catalogIndex);
  assert.equal(style.trim().split('\n').at(-1), "@import url('/css/responsive/hardening.css');");
});

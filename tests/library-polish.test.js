const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('biblioteca usa texto curto e profissional na estante comunitária', () => {
  const polish = read('public/js/library-polish.js');
  for (const marker of [
    'Leituras da comunidade',
    'Inclua livros que você leu, publique reviews e abra discussões',
    'Adicionar livro lido',
    'Nenhum livro adicionado ainda.',
    'Inclua uma leitura para começar a estante da comunidade.',
  ]) {
    assert.ok(polish.includes(marker), `texto da estante ausente: ${marker}`);
  }
});

test('acabamento da biblioteca respeita a ordem responsiva global', () => {
  const style = read('public/style.css').trim().split('\n');
  const responsive = style.indexOf("@import url('/css/responsive.css');");
  const polish = style.indexOf("@import url('/css/library-polish.css');");
  const hardening = style.indexOf("@import url('/css/layout-hardening-v328.css');");
  assert.ok(responsive >= 0);
  assert.ok(polish > responsive);
  assert.ok(hardening > polish);
  assert.equal(style.at(-1), "@import url('/css/layout-hardening-v328.css');");
  assert.equal(style.filter((line) => line.includes('library-polish.css')).length, 1);
});

test('contadores possuem fluxo flexível para desktop, tablet e celular', () => {
  const css = read('public/css/library-polish.css');
  for (const marker of [
    '.stats.library-stats {',
    'display: flex;',
    'flex-wrap: wrap;',
    'flex: 1 1 calc(20% - 1px);',
    '@media (max-width: 1040px)',
    'flex-basis: calc(33.333% - 1px);',
    'flex-basis: calc(50% - 1px);',
    '@media (max-width: 699px)',
    '.stats.library-stats > .stat:last-child',
    'flex-basis: 100%;',
    '@media (max-width: 360px)',
  ]) {
    assert.ok(css.includes(marker), `proteção responsiva ausente: ${marker}`);
  }
});

test('estante de livros não cria colunas vazias nem estica a capa pela review', () => {
  const css = read('public/css/library-polish.css');
  for (const marker of [
    'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    '.book-shelf:has(> .book-card:only-child) > .book-card',
    'grid-template-columns: clamp(160px, 22vw, 230px) minmax(0, 1fr);',
    'aspect-ratio: 2 / 3;',
    'align-self: start;',
    '@media (max-width: 520px)',
    'width: min(170px, 56vw);',
  ]) {
    assert.ok(css.includes(marker), `proteção da estante ausente: ${marker}`);
  }
});

test('main instala o acabamento da biblioteca junto das melhorias existentes', () => {
  const main = read('public/js/main.js');
  assert.ok(main.includes("import { installLibraryPolish } from './library-polish.js';"));
  assert.ok(main.includes('installLibraryPolish();'));
});

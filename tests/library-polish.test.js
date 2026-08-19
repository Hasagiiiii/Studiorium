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

test('acabamento da biblioteca é carregado depois das camadas responsivas globais', () => {
  const style = read('public/style.css').trim().split('\n');
  assert.equal(style.at(-1), "@import url('/css/library-polish.css');");
  assert.equal(style.filter((line) => line.includes('library-polish.css')).length, 1);
});

test('contadores possuem layouts dedicados para desktop, tablet e celular', () => {
  const css = read('public/css/library-polish.css');
  for (const marker of [
    'grid-template-columns: repeat(5, minmax(0, 1fr));',
    '@media (max-width: 1040px)',
    'grid-template-columns: repeat(6, minmax(0, 1fr));',
    '@media (max-width: 699px)',
    'grid-template-columns: repeat(2, minmax(0, 1fr));',
    '.library-stats .stat:last-child',
    'grid-column: 1 / -1;',
    '@media (max-width: 360px)',
    'grid-template-columns: 1fr;',
  ]) {
    assert.ok(css.includes(marker), `proteção responsiva ausente: ${marker}`);
  }
});

test('main instala o acabamento da biblioteca junto das melhorias existentes', () => {
  const main = read('public/js/main.js');
  assert.ok(main.includes("import { installLibraryPolish } from './library-polish.js';"));
  assert.ok(main.includes('installLibraryPolish();'));
});

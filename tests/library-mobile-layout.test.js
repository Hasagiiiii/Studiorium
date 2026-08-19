const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('métricas da biblioteca usam fluxo flexível sem células implícitas', () => {
  const css = read('public/css/library-polish.css');
  assert.match(css, /\.stats\.library-stats\s*\{[\s\S]*display:\s*flex;/);
  assert.match(css, /flex-wrap:\s*wrap;/);
  assert.match(css, /flex-basis:\s*calc\(33\.333% - 1px\)/);
  assert.match(css, /flex-basis:\s*calc\(50% - 1px\)/);
  assert.match(css, /flex-basis:\s*100%/);
});

test('busca da biblioteca preserva input e leva botão para linha própria no celular', () => {
  const css = read('public/css/library-polish.css');
  assert.match(css, /\.library-search\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/);
  assert.match(css, /@media \(max-width: 699px\)[\s\S]*\.library-search \.solid\s*\{[\s\S]*grid-column:\s*1 \/ -1;/);
});

test('acabamento não usa zoom ou escala artificial para corrigir viewport', () => {
  const css = read('public/css/library-polish.css');
  assert.equal(/\bzoom\s*:/.test(css), false);
  assert.equal(/transform\s*:\s*scale\(/.test(css), false);
});

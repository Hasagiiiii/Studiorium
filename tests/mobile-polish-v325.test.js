const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const polish = read('public/css/mobile-polish-v325.css');
const style = read('public/style.css');

test('subtítulo acadêmico não usa margem negativa e preserva separação do título', () => {
  assert.match(polish, /\.pagehero \.pagetitle \+ \.academic-translation/);
  assert.match(polish, /margin: 10px 0 18px/);
  assert.doesNotMatch(polish, /academic-translation[\s\S]{0,120}margin:\s*-\d/);
});

test('Scriptorium organiza atalhos e estante vazia progressivamente no mobile', () => {
  assert.match(polish, /:has\(\.personal-shelf\)/);
  assert.match(polish, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(polish, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(polish, /grid-template-columns: 1fr/);
  assert.match(polish, /\.mini-shelf:has\(\.empty\)/);
});

test('acabamento mobile precede a responsividade e o endurecimento final', () => {
  const responsiveIndex = style.indexOf("@import url('/css/responsive.css')");
  const polishIndex = style.indexOf("@import url('/css/mobile-polish-v325.css')");
  const hardeningIndex = style.indexOf("@import url('/css/layout-hardening-v328.css')");
  assert.ok(polishIndex >= 0);
  assert.ok(responsiveIndex > polishIndex);
  assert.ok(hardeningIndex > responsiveIndex);
  assert.equal(style.trim().split('\n').at(-1), "@import url('/css/layout-hardening-v328.css');");
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const polish = readFileSync('public/css/mobile-polish-v325.css', 'utf8');
const style = readFileSync('public/style.css', 'utf8');

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

test('acabamento mobile é carregado depois da responsividade global', () => {
  const responsiveIndex = style.indexOf("@import url('/css/responsive.css')");
  const polishIndex = style.indexOf("@import url('/css/mobile-polish-v325.css')");
  assert.ok(responsiveIndex >= 0);
  assert.ok(polishIndex > responsiveIndex);
});

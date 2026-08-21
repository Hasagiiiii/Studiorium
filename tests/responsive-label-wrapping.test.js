const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('ações responsivas preservam palavras inteiras', () => {
  const css = read('public/css/responsive/hardening.css');
  const actionRule = css.match(
    /button,[\s\S]*?\.social-action\s*\{([\s\S]*?)\}/,
  )?.[1];

  assert.ok(actionRule, 'regra final de ações responsivas ausente');
  assert.match(actionRule, /white-space:\s*normal;/);
  assert.match(actionRule, /overflow-wrap:\s*normal;/);
  assert.match(actionRule, /word-break:\s*normal;/);
  assert.match(actionRule, /hyphens:\s*none;/);
  assert.doesNotMatch(actionRule, /overflow-wrap:\s*anywhere;/);
});

test('cabeçalho dos painéis sociais refluí sem partir a ação', () => {
  const css = read('public/css/social-final-polish.css');
  const headRule = css.match(/\.social-panel-head\s*\{([\s\S]*?)\}/)?.[1];
  const linkRule = css.match(/\.social-panel-head > a\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(headRule, 'regra de cabeçalho social ausente');
  assert.match(headRule, /flex-wrap:\s*wrap;/);

  assert.ok(linkRule, 'regra da ação do cabeçalho social ausente');
  assert.match(linkRule, /flex:\s*0 0 auto;/);
  assert.match(linkRule, /white-space:\s*nowrap;/);
  assert.match(linkRule, /overflow-wrap:\s*normal;/);
  assert.match(linkRule, /word-break:\s*normal;/);
});

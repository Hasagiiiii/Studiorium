const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('endurecimento responsivo é a camada final da cascata', () => {
  const style = read('public/style.css').trim().split('\n');
  const responsive = style.indexOf("@import url('/css/responsive.css');");
  const hardening = style.indexOf("@import url('/css/layout-hardening-v328.css');");
  assert.ok(responsive >= 0);
  assert.ok(hardening > responsive);
  assert.equal(style.at(-1), "@import url('/css/layout-hardening-v328.css');");
});

test('telas muito estreitas possuem tratamento dedicado sem remover ações', () => {
  const css = read('public/css/layout-hardening-v328.css');
  for (const marker of [
    '@media (max-width: 380px)',
    '@media (max-width: 330px)',
    '.nav .nav-actions .outline',
    '.nav .nav-actions .solid',
    '.nav .notification-trigger',
    '.nav .iconbtn',
    'text-overflow: ellipsis;',
  ]) {
    assert.ok(css.includes(marker), `proteção extrema ausente: ${marker}`);
  }
});

test('etiquetas e metadados longos não forçam overflow horizontal', () => {
  const css = read('public/css/layout-hardening-v328.css');
  assert.ok(css.includes('.pill,'));
  assert.ok(css.includes('.badge'));
  assert.ok(css.includes('overflow-wrap: anywhere;'));
  assert.ok(css.includes('.meta > *'));
  assert.ok(css.includes('max-width: 100%;'));
});

test('pôster do Ateliê refluí em telas estreitas sem escala artificial', () => {
  const css = read('public/css/layout-hardening-v328.css');
  for (const marker of [
    'grid-template-columns: repeat(2, minmax(0, 1fr));',
    '@media screen and (max-width: 720px)',
    '@media screen and (max-width: 520px)',
    '.poster-shell',
    '.postergrid',
    '.postersection',
    'grid-template-columns: 1fr;',
    'overflow-x: hidden;',
    'word-break: normal;',
  ]) {
    assert.ok(css.includes(marker), `proteção do pôster ausente: ${marker}`);
  }
  assert.equal(css.includes('transform: scale('), false);
  assert.equal(css.includes('zoom:'), false);
});

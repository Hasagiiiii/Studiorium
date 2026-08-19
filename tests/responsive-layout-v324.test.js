const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('responsividade global precede apenas o endurecimento final', () => {
  const style = read('public/style.css').trim().split('\n');
  const responsive = style.indexOf("@import url('/css/responsive.css');");
  const hardening = style.indexOf("@import url('/css/layout-hardening-v328.css');");
  assert.ok(responsive >= 0);
  assert.ok(hardening > responsive);
  assert.equal(style.at(-1), "@import url('/css/layout-hardening-v328.css');");
});

test('layout possui guardas contra overflow horizontal e componentes espremidos', () => {
  const css = read('public/css/responsive.css');
  for (const marker of [
    'overflow-x: clip;',
    'min-width: 0;',
    'max-width: 100%;',
    '.tablewrap',
    '.poster-shell',
    '.template-stage',
    '.notification-panel',
    '.book-card',
    '.preview-pane iframe',
  ]) {
    assert.ok(css.includes(marker), `proteção responsiva ausente: ${marker}`);
  }
});

test('layout cobre notebook tablet celular pequeno landscape e toque', () => {
  const css = read('public/css/responsive.css');
  for (const breakpoint of [
    '@media (max-width: 1180px)',
    '@media (max-width: 1024px)',
    '@media (max-width: 900px)',
    '@media (max-width: 720px)',
    '@media (max-width: 520px)',
    '@media (max-width: 380px)',
    '@media (max-height: 560px) and (orientation: landscape) and (max-width: 1000px)',
    '@media (hover: none) and (pointer: coarse)',
  ]) {
    assert.ok(css.includes(breakpoint), `faixa responsiva ausente: ${breakpoint}`);
  }
});

test('biblioteca e áreas complexas reduzem colunas progressivamente', () => {
  const css = read('public/css/responsive.css');
  assert.ok(css.includes('grid-template-columns: repeat(5, minmax(0, 1fr));'));
  assert.ok(css.includes('.library-filters'));
  assert.ok(css.includes('.editorwrap'));
  assert.ok(css.includes('.article-layout'));
  assert.ok(css.includes('.newsroom-grid'));
  assert.ok(css.includes('.template-editor-layout'));
  assert.ok(css.includes('.code-grid'));
});

test('estilos base do administrador ficam no módulo administrativo', () => {
  const responsive = read('public/css/responsive.css');
  const admin = read('public/css/admin-tech.css');
  assert.equal(responsive.includes('/* Painel administrativo v2.2 */'), false);
  assert.ok(admin.includes('.admin-stats'));
  assert.ok(admin.includes('.admin-tabs'));
  assert.ok(admin.includes('.admin-toggles'));
  assert.ok(admin.includes('.tech-hubs'));
});

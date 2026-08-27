import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('mobile composer exposes four social creation paths', () => {
  const source = read('public/js/views/home-social-widgets.js');
  for (const label of ['Pesquisa', 'Discussão', 'Projeto', 'Criação']) {
    assert.match(source, new RegExp(`>${label}<`));
  }
  assert.match(source, /social-composer-sheet/);
  assert.match(source, /social-composer-options/);
});

test('mobile UI protects dense social surfaces and reduced motion', () => {
  const css = read('public/css/social-first-mobile.css');
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /social-composer-options/);
  assert.match(css, /community-hero-card/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
});

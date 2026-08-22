const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('parchment transitions are installed and styled', () => {
  const main = read('public/js/main.js');
  const style = read('public/style.css');
  const motion = read('public/js/animations/parchment.js');
  const css = read('public/css/animations/parchment.css');

  assert.match(main, /installParchmentTransitions/);
  assert.match(style, /animations\/parchment\.css/);
  assert.match(motion, /\/pesquisas\\\//);
  assert.match(motion, /\/projetos\\\//);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(motion, /stopImmediatePropagation/);
  assert.match(css, /parchment-transition-paper/);
  assert.match(css, /parchment-seal/);
  assert.match(css, /data-motion='reduced'/);
});

test('pergaminho abre fisicamente em fases sem disputar cliques', () => {
  const motion = read('public/js/animations/parchment.js');
  const css = read('public/css/animations/parchment.css');

  for (const marker of [
    'transitionRunning',
    'centerSealedScroll',
    'breakSeal',
    'unrollPaper',
    'dissolveAfterNavigation',
    'parchment-transition-backdrop',
    'parchment-transition-paper',
    'parchment-roll-left',
    'parchment-roll-right',
    'parchment-tie-left',
    'parchment-tie-right',
    "watermark.textContent = 'STUDIORIUM'",
    "clipPath: 'inset(0 48% 0 48% round 14px)'",
    'leftRollAnimation',
    'rightRollAnimation',
  ]) {
    assert.ok(motion.includes(marker), `movimento físico ausente: ${marker}`);
  }

  for (const marker of [
    '.parchment-transition-layer',
    '.parchment-transition-backdrop',
    '.parchment-transition-scroll',
    '.parchment-transition-paper',
    '.parchment-roll::before',
    '.parchment-roll::after',
    '.parchment-tie-left',
    '.parchment-tie-right',
    '.parchment-watermark',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    assert.ok(css.includes(marker), `acabamento físico ausente: ${marker}`);
  }
});

test('pergaminho preserva navegação acessível e fallback de movimento reduzido', () => {
  const motion = read('public/js/animations/parchment.js');

  assert.match(motion, /link\.target && link\.target !== '_self'/);
  assert.match(motion, /link\.hasAttribute\('download'\)/);
  assert.match(motion, /prefersReducedMotion\(\)/);
  assert.match(motion, /event\.metaKey/);
  assert.match(motion, /event\.ctrlKey/);
  assert.match(motion, /event\.shiftKey/);
  assert.match(motion, /event\.altKey/);
  assert.match(motion, /finally \{[\s\S]*cleanup\(parts\)[\s\S]*transitionRunning = false/);
});

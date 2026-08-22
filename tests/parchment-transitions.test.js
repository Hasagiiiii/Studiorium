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
  assert.match(css, /parchment-transition-sheet/);
  assert.match(css, /parchment-seal/);
  assert.match(css, /data-motion='reduced'/);
});

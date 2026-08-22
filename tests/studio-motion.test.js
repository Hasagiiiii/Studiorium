const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('studio motion is wired with accessible fallbacks', () => {
  const main = read('public/js/main.js');
  const style = read('public/style.css');
  const motion = read('public/js/animations/studio-motion.js');
  const css = read('public/css/animations/studio-motion.css');
  const core = read('public/js/views/core.js');

  assert.match(main, /installStudioMotion/);
  assert.match(style, /animations\/studio-motion\.css/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(motion, /MutationObserver/);
  assert.match(motion, /social-pulse/);
  assert.match(motion, /pointermove/);
  assert.match(css, /--motion-rx/);
  assert.match(css, /data-motion='reduced'/);
  assert.doesNotMatch(core, /\['\/comunidades\/design-templates', 'Criação'\]/);
  assert.match(core, /\['\/comunidades', 'Comunidades'\]/);
});

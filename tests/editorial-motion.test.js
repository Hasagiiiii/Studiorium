const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('movimento editorial usa linguagem própria por área', () => {
  const main = read('public/js/main.js');
  const motion = read('public/js/animations/editorial-motion.js');
  const css = read('public/css/animations/editorial-motion.css');
  const style = read('public/style.css');

  assert.match(main, /installEditorialMotion/);
  assert.match(style, /animations\/editorial-motion\.css/);
  assert.match(motion, /routeTheme/);
  assert.match(motion, /IntersectionObserver/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(css, /book-card:hover \.book-cover/);
  assert.match(css, /news-card h3::after/);
  assert.match(css, /editorial-seal-hit/);
  assert.match(css, /studio-guided-option::before/);
});

test('pergaminho abre também modelos e matérias sem nova aba', () => {
  const motion = read('public/js/animations/parchment.js');

  assert.match(motion, /\/templates\\\//);
  assert.match(motion, /\/modelos-livres\\\//);
  assert.match(motion, /\/noticias\\\//);
  assert.match(motion, /link\.target && link\.target !== '_self'/);
  assert.match(motion, /goto\(link\.pathname \+ link\.search \+ link\.hash\)/);
});

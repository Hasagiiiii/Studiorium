const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('entrada usa loader temático sem depender de rede externa', () => {
  const main = read('public/js/main.js');
  const loader = read('public/js/animations/startup-loader.js');
  const style = read('public/style.css');
  const css = read('public/css/animations/startup-loader.css');

  assert.match(main, /installStartupLoader/);
  assert.match(style, /animations\/startup-loader\.css/);
  assert.match(loader, /studiorium-loader-emblem/);
  assert.match(loader, /loader-ivy/);
  assert.match(loader, /loader-cup/);
  assert.match(loader, /loader-seal-letter/);
  assert.doesNotMatch(loader, /https?:\/\//);
  assert.match(css, /loader-ivy-wrap/);
  assert.match(css, /loader-ink-rise/);
});

test('loader espera primeira renderização e respeita redução de movimento', () => {
  const loader = read('public/js/animations/startup-loader.js');
  const css = read('public/css/animations/startup-loader.css');

  assert.match(loader, /waitForFirstRender/);
  assert.match(loader, /MutationObserver/);
  assert.match(loader, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /html\[data-motion='reduced'\]/);
});

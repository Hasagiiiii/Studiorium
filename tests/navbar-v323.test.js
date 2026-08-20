const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('navegação acadêmica permanece legível em desktop e móvel', () => {
  const css = read('public/css/responsive/navigation.css');
  const core = read('public/js/views/core.js');

  assert.ok(core.includes('class="shell navin"'));
  assert.ok(core.includes('class="navlinks"'));
  assert.ok(core.includes('class="iconbtn mobile"'));
  assert.ok(css.includes('width: min(1440px, calc(100% - 32px));'));
  assert.ok(css.includes('white-space: nowrap;'));
  assert.ok(css.includes('@media (max-width: 1120px)'));
  assert.ok(css.includes('text-overflow: ellipsis;'));
});

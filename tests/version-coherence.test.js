const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('manifesto e lockfile declaram a mesma versão atual', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(pkg.version, '3.2.8');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('folha principal não carrega o mesmo módulo CSS duas vezes', () => {
  const imports = read('public/style.css')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('@import '));
  assert.equal(new Set(imports).size, imports.length);
});

test('camadas responsivas mantêm ordem determinística', () => {
  const imports = read('public/style.css').trim().split(/\r?\n/);
  const responsive = imports.indexOf("@import url('/css/responsive.css');");
  const hardening = imports.indexOf("@import url('/css/layout-hardening-v328.css');");
  assert.ok(responsive >= 0);
  assert.ok(hardening > responsive);
  assert.equal(imports.at(-1), "@import url('/css/layout-hardening-v328.css');");
});

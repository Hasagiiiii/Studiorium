const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const widgets = readFileSync(path.join(root, 'public/js/views/home-social-widgets.js'), 'utf8');
const css = readFileSync(path.join(root, 'public/css/social-experience.css'), 'utf8');

test('community pulse includes a lightweight activity distribution', () => {
  assert.match(widgets, /function pulseDistribution/);
  assert.match(widgets, /social-pulse-distribution/);
  assert.match(widgets, /itens em circulação/);
  assert.match(widgets, /role="img"/);
  assert.match(widgets, /aria-label="Distribuição da atividade/);
});

test('activity distribution is CSS-first and dependency-free', () => {
  assert.match(css, /\.social-pulse-overview/);
  assert.match(css, /\.social-pulse-distribution/);
  assert.match(css, /\.social-pulse-segment/);
  assert.match(css, /flex: var\(--share/);
  assert.doesNotMatch(widgets, /chart\.js|d3|recharts|echarts/i);
});

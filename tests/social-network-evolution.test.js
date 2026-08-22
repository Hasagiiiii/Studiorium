const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('movimento social é progressivo, leve e respeita redução de movimento', () => {
  const main = read('public/js/main.js');
  const motion = read('public/js/animations/social-motion.js');

  assert.match(main, /installSocialMotion/);
  assert.match(motion, /IntersectionObserver/);
  assert.match(motion, /MutationObserver/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /element\.animate/);
});

test('home social trata criação como comunidade e expõe pulso de atividade', () => {
  const home = read('public/js/views/home-social.js');
  const widgets = read('public/js/views/home-social-widgets.js');
  const css = read('public/css/social-experience.css');

  assert.match(home, /\/comunidades\/design-templates/);
  assert.match(home, /renderCreationHub/);
  assert.match(home, /renderCommunityPulse/);
  assert.match(widgets, /Comunidade de Criação/);
  assert.match(widgets, /Templates, materiais e ideias vivem juntos/);
  assert.match(widgets, /pulseMetric/);
  assert.match(css, /social-creation-hub/);
  assert.match(css, /social-pulse/);
});

test('fundação social não adiciona dependência de animação pesada', () => {
  const pkg = JSON.parse(read('package.json'));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

  assert.equal(dependencies['animejs'], undefined);
  assert.equal(dependencies['motion'], undefined);
  assert.equal(dependencies['framer-motion'], undefined);
});

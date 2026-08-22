const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('estilos responsivos e animações ficam separados por responsabilidade', () => {
  for (const file of [
    'public/css/responsive/navigation.css',
    'public/css/responsive/mobile.css',
    'public/css/responsive/home.css',
    'public/css/responsive/headings.css',
    'public/css/responsive/global.css',
    'public/css/responsive/hardening.css',
    'public/css/animations/interactions.css',
    'public/css/animations/motion.css',
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `camada ausente: ${file}`);
  }

  for (const obsolete of [
    'public/css/nav-v323.css',
    'public/css/mobile-polish-v325.css',
    'public/css/home-feature-align.css',
    'public/css/adaptive-headings.css',
    'public/css/responsive.css',
    'public/css/layout-hardening-v328.css',
    'public/css/interactions-v326.css',
  ]) {
    assert.equal(
      fs.existsSync(path.join(root, obsolete)),
      false,
      `caminho antigo voltou: ${obsolete}`,
    );
  }
});

test('features de interface possuem módulos próprios e enhancements apenas orquestra', () => {
  for (const file of [
    'public/js/features/academic-identity.js',
    'public/js/features/armarium.js',
    'public/js/animations/motion.js',
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `módulo ausente: ${file}`);
  }

  const enhancements = read('public/js/enhancements.js');
  assert.match(enhancements, /features\/academic-identity\.js/);
  assert.match(enhancements, /features\/armarium\.js/);
  assert.doesNotMatch(enhancements, /const navigationNames/);
  assert.doesNotMatch(enhancements, /function armariumPanel/);
});

test('Home social usa app shell responsivo e o CSS antigo não protege mais quatro cards', () => {
  const home = read('public/js/views/home-social.js');
  const socialCss = read('public/css/social-home.css');
  const legacyHomeCss = read('public/css/responsive/home.css');

  assert.match(home, /class="social-shell shell"/);
  assert.match(home, /social-left/);
  assert.match(home, /social-feed/);
  assert.match(home, /social-right/);
  assert.match(socialCss, /grid-template-columns: 220px minmax\(0, 1fr\) 270px/);
  assert.match(socialCss, /@media \(max-width: 1080px\)/);
  assert.match(socialCss, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(legacyHomeCss, /feature:nth-child\(4\)/);
  assert.doesNotMatch(legacyHomeCss, /!important/);
});

test('movimento tem módulo próprio e respeita preferência de acessibilidade', () => {
  const main = read('public/js/main.js');
  const motion = read('public/js/animations/motion.js');
  const css = read('public/css/animations/motion.css');
  assert.match(main, /installMotionPreferences/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /dataset\.motion/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /transition-duration: 0\.01ms/);
});

test('recursos públicos podem ser lidos sem liberar rascunhos privados', () => {
  const codeProjects = read('src/server/routes/code-projects.js');
  const publications = read('src/server/routes/publications.js');

  assert.match(codeProjects, /currentUser/);
  assert.match(codeProjects, /q\.data\?\.visibility === 'public'/);
  assert.match(codeProjects, /!isOwner && !isPublic/);

  assert.match(publications, /currentUser/);
  assert.match(publications, /publication\?\.status === 'published'/);
  assert.match(publications, /!isOwner && !isPublic/);
});

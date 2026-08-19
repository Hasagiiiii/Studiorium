const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(target);
    return entry.isFile() && entry.name.endsWith('.js') ? [target] : [];
  });
}

test('interface não usa alert confirm ou prompt nativos do navegador', () => {
  const publicJs = path.join(root, 'public', 'js');
  const nativeDialog = /\b(?:alert|confirm|prompt)\s*\(/;
  for (const file of jsFiles(publicJs)) {
    const source = fs.readFileSync(file, 'utf8');
    assert.equal(
      nativeDialog.test(source),
      false,
      `diálogo nativo ainda encontrado em ${path.relative(root, file)}`,
    );
  }
});

test('botões de ação com data atributo não submetem formulário por acidente', () => {
  const events = read('public/js/events.js');
  assert.match(events, /preventAccidentalActionSubmit/);
  assert.match(events, /Object\.keys\(button\.dataset\)\.length/);
  assert.match(events, /event\.preventDefault\(\)/);
});

test('modal interno é acessível e permanece dentro da interface', () => {
  const feedback = read('public/js/ui-feedback.js');
  const css = read('public/css/interactions-v326.css');
  assert.match(feedback, /aria-modal/);
  assert.match(feedback, /role', 'dialog/);
  assert.match(feedback, /event\.key === 'Escape'/);
  assert.match(feedback, /event\.key !== 'Tab'/);
  assert.match(css, /\.ui-dialog-backdrop/);
  assert.match(css, /position: fixed/);
  assert.match(css, /min-height: 100dvh/);
});

test('acabamento de ações não redefine grids ou estrutura das páginas existentes', () => {
  const css = read('public/css/interactions-v326.css');
  for (const forbidden of [
    /\n\.shell\b/,
    /\n\.card\b/,
    /\n\.stats\b/,
    /\n\.featuregrid\b/,
    /\n\.grid2\b/,
    /\n\.grid3\b/,
    /\n\.library-stats\b/,
    /\n\.navin\b/,
  ]) {
    assert.doesNotMatch(css, forbidden);
  }
  assert.match(css, /overflow-wrap: break-word/);
  assert.doesNotMatch(css, /overflow-wrap: anywhere/);
});

test('folha de interações fica entre responsividade e polimentos já existentes', () => {
  const style = read('public/style.css');
  const responsive = style.indexOf("@import url('/css/responsive.css')");
  const interactions = style.indexOf("@import url('/css/interactions-v326.css')");
  const library = style.indexOf("@import url('/css/library-polish.css')");
  const hardening = style.indexOf("@import url('/css/layout-hardening-v328.css')");
  assert.ok(responsive >= 0 && interactions > responsive);
  assert.ok(library > interactions);
  assert.ok(hardening > library);
});

test('notícias publicadas podem ser destacadas sem recertificação e ganham prioridade na home', () => {
  const adminNews = read('src/server/routes/admin-news.js');
  const bootstrap = read('src/server/routes/bootstrap.js');
  const home = read('public/js/views/home-library.js');
  const featureUi = read('public/js/admin-news-feature.js');
  const main = read('public/js/main.js');

  assert.match(adminNews, /const featureOnly =/);
  assert.match(adminNews, /Somente notícias publicadas e certificadas podem receber destaque/);
  assert.match(adminNews, /news\.article\.feature/);
  assert.match(bootstrap, /from\('news_articles'\)[\s\S]*?order\('featured'/);
  assert.match(home, /const news = \(b\.news \|\| \[\]\)\.slice\(0, 3\)/);
  assert.match(home, /news-home-grid/);
  assert.match(featureUi, /data-admin-news-feature/);
  assert.match(featureUi, /Destacar na página inicial/);
  assert.match(main, /installAdminNewsFeature/);
});

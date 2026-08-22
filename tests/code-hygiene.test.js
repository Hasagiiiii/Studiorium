const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');

const router = read('public/js/router.js');
const techView = read('public/js/views/tech.js');
const techCss = read('public/css/tech-polish.css');
const feed = read('public/js/views/home-social-feed.js');
const widgets = read('public/js/views/home-social-widgets.js');
const views = read('public/js/views.js');
const library = read('public/js/views/home-library.js');
const community = read('public/js/views/community.js');
const filters = read('public/js/events/filters.js');
const main = read('public/js/main.js');
const enhancements = read('public/js/enhancements.js');
const catalog = read('public/js/book-catalog.js');
const studioMotion = read('public/js/animations/studio-motion.js');
const editorialMotion = read('public/js/animations/editorial-motion.js');
const adminNews = read('public/js/admin-news-feature.js');
const adminPublished = read('public/js/admin-published-actions.js');
const authorization = read('src/server/authorization.js');

test('Oficina mantém rota própria e busca isolada da Biblioteca', () => {
  assert.match(router, /return await oficina\(\);/);
  assert.doesNotMatch(
    router,
    /\['\/oficina', '\/tech'\][\s\S]{0,500}replaceState\([^)]*\/comunidades/,
  );
  assert.match(techView, /class="tech-search"/);
  assert.doesNotMatch(techView, /class="library-search"/);
  assert.match(techCss, /\.tech-search/);
  assert.doesNotMatch(techCss, /\[data-tech-filter\] \.library-search/);
});

test('ranking do feed usa números crus e formata apenas na apresentação', () => {
  assert.match(feed, /function numeric\(value\)/);
  assert.match(feed, /const boosts = numeric\(entry\.item\.boosts\)/);
  assert.match(feed, /const views = numeric\(entry\.item\.views\)/);
  assert.doesNotMatch(feed, /return num\(entry\.item\.boosts\)/);
  assert.doesNotMatch(feed, /Math\.log10\(num\(entry\.item\.views\)/);
});

test('Pulso conta todos os projetos e não cria links públicos inválidos para projetos de código', () => {
  assert.match(widgets, /const codeProjects = state\.boot\.codeProjects \|\| \[\]/);
  assert.match(widgets, /const communityProjects = state\.boot\.communityProjects \|\| \[\]/);
  assert.match(widgets, /const projects = communityProjects\.slice\(0, 5\)/);
  assert.match(widgets, /projects: codeProjects\.length \+ communityProjects\.length/);
});

test('ciclo de render substitui observers globais nos módulos de acabamento', () => {
  assert.match(router, /studiorium:rendered/);
  for (const source of [
    enhancements,
    catalog,
    studioMotion,
    editorialMotion,
    adminNews,
    adminPublished,
  ]) {
    assert.match(source, /studiorium:rendered/);
    assert.doesNotMatch(source, /new MutationObserver/);
  }
});

test('motion genérico não disputa cards pertencentes ao motion editorial', () => {
  assert.match(studioMotion, /SPECIALIZED_MOTION_TARGETS/);
  assert.match(studioMotion, /genericMotionTarget/);
  assert.match(studioMotion, /fill: 'backwards'/);
  assert.match(editorialMotion, /fill: 'backwards'/);
});

test('barrel e views não mantêm telas legadas já consolidadas em Comunidades', () => {
  assert.doesNotMatch(views, /\bacervo\b/);
  assert.doesNotMatch(views, /\bcoloquio\b/);
  assert.doesNotMatch(library, /function home\(/);
  assert.doesNotMatch(library, /function acervo\(/);
  assert.doesNotMatch(library, /libraryTemplateCard/);
  assert.doesNotMatch(community, /function coloquio\(/);
  assert.doesNotMatch(main, /library-polish|LibraryPolish/);
});

test('handlers de filtros removidos junto com as telas antigas', () => {
  assert.doesNotMatch(filters, /data-acervo-filter/);
  assert.doesNotMatch(filters, /data-research-filter/);
  assert.doesNotMatch(filters, /data-discussion-filter/);
  assert.match(filters, /data-library-filter/);
  assert.match(filters, /data-tech-filter/);
});

test('RBAC falha fechado em erro operacional e mantém legado apenas para schema ausente', () => {
  assert.match(authorization, /function deniedAuthorization/);
  assert.match(authorization, /if \(isMissingRbacTable\(assignments\.error\)\) return fallback/);
  assert.match(authorization, /if \(isMissingRbacTable\(grants\.error\)\) return fallback/);
  assert.match(authorization, /return deniedAuthorization\(\);/);
});

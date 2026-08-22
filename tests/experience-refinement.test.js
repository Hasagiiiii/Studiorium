const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Colóquio oferece mapa emergente, busca, ordenação e orientação de resposta', () => {
  const view = read('public/js/views/community.js');
  const events = read('public/js/events/community.js');
  const route = read('src/server/routes/discussions.js');

  assert.match(view, /Mapa das dúvidas desta conversa/);
  assert.match(view, /data-comment-search/);
  assert.match(view, /data-comment-order/);
  assert.match(view, /data-reply-quality/);
  assert.match(events, /refreshCommentMap/);
  assert.match(route, /buildReplyMap/);
});

test('Laboratório expõe console isolado, captura de erros e estado de salvamento', () => {
  const view = read('public/js/views/tech.js');
  const events = read('public/js/events/projects.js');

  assert.match(view, /sandbox="allow-scripts"/);
  assert.match(view, /data-lab-console-list/);
  assert.match(view, /unhandledrejection/);
  assert.match(events, /event\.source !== frame\.contentWindow/);
  assert.match(events, /Alterações não salvas/);
});

test('descoberta contextual conecta as áreas sem listas editoriais fixas', () => {
  const intelligence = read('public/js/content-intelligence.js');
  const library = read('public/js/views/home-library.js');
  const news = read('public/js/views/news.js');
  const workshop = read('public/js/views/tech.js');

  assert.match(intelligence, /rankRelated/);
  assert.match(intelligence, /emergentTopics/);
  assert.match(intelligence, /recurringTopics\.length >= 3/);
  assert.match(library, /Índice emergente/);
  assert.match(library, /emergentTopics\(boot\.publications\)/);
  assert.doesNotMatch(library, /\.\.\.boot\.publications, \.\.\.boot\.templates/);
  assert.match(news, /Contexto editorial/);
  assert.match(workshop, /Próximos passos/);
});

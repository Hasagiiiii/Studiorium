const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { cleanReview, moderateNews } = require('../src/server/news-moderation');
const { resetEmailHtml } = require('../src/server/email');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('notícias exigem triagem local e certificação editorial humana', () => {
  const news = read('src/server/routes/news.js');
  const adminNews = read('src/server/routes/admin-news.js');
  const schema = read('supabase/upgrade-v2.9-editorial-studio.sql');

  assert.ok(news.includes('moderateNews(current)'));
  assert.ok(news.includes("status: 'editorial_review'"));
  assert.ok(adminNews.includes('patch.certified_by = admin.id'));
  assert.ok(adminNews.includes('patch.certified_at = now()'));
  assert.ok(schema.includes("status = 'published' and certified_at is not null"));
});

test('normalização da triagem nunca transforma resposta desconhecida em aprovação', () => {
  const flagged = cleanReview({ decision: 'anything', risks: ['risco'] });
  const approved = cleanReview({ decision: 'approved', suggestions: ['revisar'] });

  assert.equal(flagged.decision, 'flagged');
  assert.equal(approved.decision, 'approved');
  assert.equal(flagged.purpose, 'triage_only_human_certification_required');
});

test('triagem editorial local aprova texto regular e sinaliza sensacionalismo', () => {
  const base = {
    title: 'Universidade publica novo calendário acadêmico',
    summary: 'A instituição divulgou as datas do próximo semestre letivo.',
    body: 'O calendário apresenta datas de matrícula, início das aulas e avaliações.',
    sources: [
      { title: 'Universidade', url: 'https://universidade.example/calendario' },
      { title: 'Secretaria', url: 'https://secretaria.example/educacao' },
    ],
  };
  assert.equal(moderateNews(base).decision, 'approved');
  assert.equal(moderateNews({ ...base, title: 'CHOCANTE!!! Compartilhe antes que apaguem' }).decision, 'flagged');
  assert.equal(moderateNews(base).engine, 'studiorium_local_rules_v1');
});

test('recuperação de senha usa fragmento, token com hash e resposta sem enumeração', () => {
  const auth = read('src/server/routes/auth.js');
  const email = read('src/server/email.js');

  assert.ok(auth.includes('/redefinir-senha#token='));
  assert.ok(auth.includes('token_hash: hash'));
  assert.ok(auth.includes('Se a conta existir'));
  assert.ok(email.includes('https://api.resend.com/emails'));
  assert.ok(resetEmailHtml('https://example.com/#token=abc').includes('Criar nova senha'));
});

test('lixeira é recuperável e exclusão definitiva permanece separada', () => {
  const router = read('src/server/router.js');
  const projects = read('src/server/routes/projects.js');

  assert.ok(projects.includes('deleted_at: now()'));
  assert.ok(projects.includes('deleted_at: null'));
  assert.ok(router.includes('/purge'));
  assert.ok(router.includes('/restore'));
});

test('estúdio aceita fotos e importação sem liberar arquivos arbitrários', () => {
  const route = read('src/server/routes/custom-templates.js');
  const view = read('public/js/views/template-studio.js');

  for (const marker of ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']) {
    assert.ok(route.includes(marker), `formato ausente: ${marker}`);
  }
  assert.ok(route.includes('validSignature'));
  assert.ok(view.includes('data-import-template'));
  assert.ok(view.includes('data-template-asset'));
});

test('animações respeitam a preferência de reduzir movimento', () => {
  const css = read('public/css/editorial-studio.css');

  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(css.includes('overflow-wrap: anywhere'));
  assert.ok(css.includes('min-width: 0'));
});

test('saúde online informa moderação local e disponibilidade de e-mail sem expor segredos', () => {
  const system = read('src/server/routes/system.js');

  assert.ok(system.includes("moderation: 'local_rules_and_human_review'"));
  assert.ok(system.includes('emailDelivery'));
  assert.equal(system.includes('RESEND_API_KEY:'), false);
  assert.equal(system.includes('OPENAI_API_KEY:'), false);
});

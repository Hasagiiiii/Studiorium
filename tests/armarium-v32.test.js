const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v3.2 remove o catálogo demonstrativo e cria reviews comunitárias protegidas', () => {
  const migration = read('supabase/upgrade-v3.2-armarium-community.sql');
  for (const marker of [
    'create table if not exists public.book_reviews',
    'rating integer not null check (rating between 1 and 5)',
    'alter table public.book_reviews enable row level security',
    'revoke all on table public.book_reviews from public, anon, authenticated',
    'grant select, insert, update, delete on table public.book_reviews to service_role',
    "'book-republica'",
    "'book-pedagogia-autonomia'",
  ]) {
    assert.ok(migration.includes(marker), `migração do Armarium sem: ${marker}`);
  }
  assert.equal(migration.includes('insert into public.books'), false);
});

test('backend permite catálogo real, review, nota e estados da estante', () => {
  const books = read('src/server/routes/books.js');
  for (const marker of [
    "body.action === 'create'",
    "body.action === 'review'",
    'book_reviews',
    'rating_average',
    'recommendation_count',
    'safeHttpsUrl',
    'covers.openlibrary.org',
    'amazonPurchaseUrl',
    "parsed.protocol !== 'https:'",
    "eq('submitted_by', user.id)",
  ]) {
    assert.ok(books.includes(marker), `backend sem recurso: ${marker}`);
  }
  assert.ok(books.includes('new URL(raw)'));
  assert.ok(books.includes('Falha ao desfazer livro incompleto'));
});

test('interface mostra Armarium com formulário real, review, compra e três estados', () => {
  const armarium = read('public/js/features/armarium.js');
  const events = read('public/js/events/books.js');
  for (const marker of [
    'Armarium Librorum',
    'Adicionar livro que eu li',
    'Minha review',
    'nofollow sponsored',
    '<form class="book-review-form hidden"',
    'data-book-review-open',
    'data-book-save',
    'Quero ler',
    'Lendo',
    'Já li',
    'referrerpolicy="no-referrer"',
  ]) {
    assert.ok(armarium.includes(marker), `interface sem: ${marker}`);
  }
  assert.ok(events.includes("body.action = 'create'"));
  assert.ok(events.includes("body.action = 'review'"));
  assert.ok(events.includes('form.reportValidity()'));
  assert.ok(events.includes('form instanceof HTMLFormElement'));
});

test('capas HTTPS externas são compatíveis com a política de conteúdo', () => {
  const vercel = read('vercel.json');
  assert.ok(vercel.includes("img-src 'self' data: blob: https:"));
  assert.ok(vercel.includes("frame-ancestors 'none'"));
});

test('home não deixa um vazio de viewport entre hero e acessos principais', () => {
  const css = read('public/css/armarium-v32.css');
  assert.ok(css.includes('min-height: 0;'));
  assert.ok(css.includes('padding: 58px 0 46px;'));
  assert.ok(css.includes('.hero + .section'));
  assert.ok(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'));
});

test('identidade visual recupera a nomenclatura acadêmica sem loop de mutação', () => {
  const identity = read('public/js/features/academic-identity.js');
  for (const name of [
    'Bibliotheca',
    'Colloquium',
    'Scriptorium',
    'Officina',
    'Laboratorium',
    'Redactio',
    'Nuntii',
    'Catalogus',
    'Auctores',
  ]) {
    assert.ok(identity.includes(name), `nome acadêmico ausente: ${name}`);
  }
  assert.ok(identity.includes('if (subtitle.textContent !== translation)'));
});

test('navbar preserva logo e usuário sem quebrar nomes acadêmicos', () => {
  const css = read('public/css/responsive/navigation.css');
  const style = read('public/style.css');
  assert.ok(style.includes("@import url('/css/responsive/navigation.css');"));
  assert.ok(css.includes('min-width: max-content;'));
  assert.ok(css.includes('white-space: nowrap;'));
  assert.ok(css.includes('@media (max-width: 1120px)'));
  assert.ok(css.includes('.nav .navlinks {\n    display: none;'));
  assert.ok(css.includes('.nav .mobile {\n    display: grid;'));
});

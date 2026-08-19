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
    'rel',
  ]) {
    if (marker === 'rel') continue;
    assert.ok(books.includes(marker), `backend sem recurso: ${marker}`);
  }
  assert.ok(books.includes('new URL(raw)'));
  assert.ok(books.includes("parsed.protocol !== 'https:'"));
});

test('interface mostra Armarium com review, compra externa e estante em três estados', () => {
  const enhancements = read('public/js/enhancements.js');
  const events = read('public/js/events/books.js');
  for (const marker of [
    'Armarium Librorum',
    'Adicionar livro que eu li',
    'Minha review',
    'nofollow sponsored',
    'data-book-review-open',
    'data-book-save',
    'Quero ler',
    'Lendo',
    'Já li',
  ]) {
    assert.ok(enhancements.includes(marker), `interface sem: ${marker}`);
  }
  assert.ok(events.includes("body.action = 'create'"));
  assert.ok(events.includes("body.action = 'review'"));
});

test('identidade visual recupera a nomenclatura acadêmica', () => {
  const enhancements = read('public/js/enhancements.js');
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
    assert.ok(enhancements.includes(name), `nome acadêmico ausente: ${name}`);
  }
});

const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { now } = require('../security');
const S = require('../serializers');

const SHELF_STATUSES = new Set(['want_to_read', 'reading', 'read']);

async function saveBook(req, bookId) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const shelfStatus = SHELF_STATUSES.has(body.shelfStatus) ? body.shelfStatus : 'want_to_read';
  const { data: book, error: bookError } = await db()
    .from('books')
    .select('id')
    .eq('id', bookId)
    .maybeSingle();
  fail(bookError);
  if (!book) throw Object.assign(new Error('Livro não encontrado.'), { statusCode: 404 });
  const { data, error } = await db()
    .from('book_saves')
    .upsert(
      { user_id: user.id, book_id: bookId, shelf_status: shelfStatus, created_at: now() },
      { onConflict: 'user_id,book_id' },
    )
    .select('*')
    .single();
  fail(error);
  return { saved: S.bookSave(data), message: 'Livro guardado na sua estante.' };
}

async function removeBook(req, bookId) {
  const user = await requireUser(req);
  const { error } = await db()
    .from('book_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('book_id', bookId);
  fail(error);
  return { ok: true, message: 'Livro removido da sua estante.' };
}

module.exports = { saveBook, removeBook };

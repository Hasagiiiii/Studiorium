const { db, fail } = require('../db');
const { requireUser, publicUser } = require('../auth');
const { readJson } = require('../http');
const { id, now, safeText } = require('../security');
const { moderate } = require('../moderation');
const S = require('../serializers');

const SHELF_STATUSES = new Set(['want_to_read', 'reading', 'read']);

function badRequest(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function safeHttpsUrl(value, max = 1000) {
  const raw = safeText(value, max);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
    return parsed.toString().slice(0, max);
  } catch {
    return '';
  }
}

function normalizeIsbn(value) {
  return safeText(value, 32)
    .replace(/[^0-9Xx]/g, '')
    .toUpperCase()
    .slice(0, 13);
}

function amazonPurchaseUrl(title, author) {
  const url = new URL('https://www.amazon.com.br/s');
  url.searchParams.set('k', `${title} ${author}`.trim());
  const affiliateTag = safeText(process.env.STUDIORIUM_AMAZON_AFFILIATE_TAG, 80);
  if (affiliateTag) url.searchParams.set('tag', affiliateTag);
  return url.toString();
}

function serializeBook(row) {
  return {
    ...S.book(row),
    submittedBy: row.submitted_by || null,
    isbn: row.isbn || '',
    coverUrl: row.cover_url || '',
    purchaseUrl: row.purchase_url || '',
    purchaseLabel: row.purchase_label || '',
    ratingAverage: Number(row.rating_average || 0),
    reviewCount: Number(row.review_count || 0),
    recommendationCount: Number(row.recommendation_count || 0),
    createdAt: row.created_at || null,
  };
}

function serializeReview(row) {
  return {
    bookId: row.book_id,
    userId: row.user_id,
    reviewerName: row.reviewer_name || 'Membro da comunidade',
    rating: Number(row.rating || 0),
    review: row.review || '',
    recommend: row.recommend === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateCommunityText(text, label) {
  const result = moderate(text);
  if (!result.ok) badRequest(`${label}: ${result.message}`, 422);
  if (result.reviewRequired)
    badRequest(
      `${label}: o texto acionou a triagem preventiva. Ajuste a redação antes de publicar.`,
      422,
    );
}

async function refreshBookMetrics(bookId) {
  const { data: reviews, error } = await db()
    .from('book_reviews')
    .select('rating,recommend')
    .eq('book_id', bookId);
  fail(error);
  const reviewCount = reviews.length;
  const ratingAverage = reviewCount
    ? Number(
        (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewCount).toFixed(2),
      )
    : 0;
  const recommendationCount = reviews.filter((item) => item.recommend === true).length;
  const { data, error: updateError } = await db()
    .from('books')
    .update({
      rating_average: ratingAverage,
      review_count: reviewCount,
      recommendation_count: recommendationCount,
    })
    .eq('id', bookId)
    .select('*')
    .maybeSingle();
  fail(updateError);
  return data;
}

async function upsertShelf(userId, bookId, shelfStatus) {
  const { data, error } = await db()
    .from('book_saves')
    .upsert(
      { user_id: userId, book_id: bookId, shelf_status: shelfStatus, created_at: now() },
      { onConflict: 'user_id,book_id' },
    )
    .select('*')
    .single();
  fail(error);
  return data;
}

async function upsertReview(user, bookId, body) {
  const rating = Number(body.rating);
  const review = safeText(body.review, 2400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    badRequest('Escolha uma nota de 1 a 5 para publicar a review.');
  if (review.length < 10) badRequest('Escreva uma review com pelo menos 10 caracteres.');
  validateCommunityText(review, 'Review');

  const { data: book, error: bookError } = await db()
    .from('books')
    .select('id')
    .eq('id', bookId)
    .maybeSingle();
  fail(bookError);
  if (!book) badRequest('Livro não encontrado.', 404);

  const profile = await publicUser(user);
  const reviewerName = user.is_minor
    ? 'Membro da comunidade'
    : safeText(profile?.displayName || profile?.username || 'Membro da comunidade', 120);
  const timestamp = now();
  const { data: previousReview, error: previousError } = await db()
    .from('book_reviews')
    .select('created_at')
    .eq('book_id', bookId)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(previousError);
  const { data, error } = await db()
    .from('book_reviews')
    .upsert(
      {
        book_id: bookId,
        user_id: user.id,
        reviewer_name: reviewerName,
        rating,
        review,
        recommend: body.recommend !== false,
        created_at: previousReview?.created_at || timestamp,
        updated_at: timestamp,
      },
      { onConflict: 'book_id,user_id' },
    )
    .select('*')
    .single();
  fail(error);
  await upsertShelf(user.id, bookId, 'read');
  const updatedBook = await refreshBookMetrics(bookId);
  return {
    review: serializeReview(data),
    book: serializeBook(updatedBook),
    message: 'Review publicada no Armarium.',
  };
}

async function createBook(user, body) {
  const title = safeText(body.title, 180);
  const author = safeText(body.author, 160);
  const description = safeText(body.description, 1400);
  const category = safeText(body.category, 80) || 'Leituras da comunidade';
  const isbn = normalizeIsbn(body.isbn);
  const suppliedCover = safeHttpsUrl(body.coverUrl);
  const coverUrl =
    suppliedCover ||
    (isbn.length >= 10
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`
      : '');
  const suppliedPurchase = safeHttpsUrl(body.purchaseUrl);
  const purchaseUrl = suppliedPurchase || amazonPurchaseUrl(title, author);
  const purchaseLabel = suppliedPurchase
    ? safeText(body.purchaseLabel, 80) || 'Ver edição / comprar'
    : 'Buscar edição na Amazon';
  const review = safeText(body.review, 2400);
  const rating = Number(body.rating);

  if (title.length < 2) badRequest('Informe o título do livro.');
  if (author.length < 2) badRequest('Informe o autor do livro.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    badRequest('Dê uma nota de 1 a 5 ao recomendar um livro.');
  if (review.length < 10) badRequest('Escreva uma review com pelo menos 10 caracteres.');
  validateCommunityText(`${title}\n${author}\n${description}`, 'Livro');
  validateCommunityText(review, 'Review');

  const { data: duplicate, error: duplicateError } = await db()
    .from('books')
    .select('id,title,author')
    .ilike('title', title)
    .ilike('author', author)
    .limit(1)
    .maybeSingle();
  fail(duplicateError);
  if (duplicate)
    badRequest('Esse livro já existe no Armarium. Abra o registro e publique sua review.', 409);

  const row = {
    id: id('book'),
    submitted_by: user.id,
    title,
    author,
    description,
    category,
    isbn,
    cover_url: coverUrl,
    purchase_url: purchaseUrl,
    purchase_label: purchaseLabel,
    cover_theme: 'umber',
    featured: false,
    rating_average: 0,
    review_count: 0,
    recommendation_count: 0,
    created_at: now(),
  };
  const { data, error } = await db().from('books').insert(row).select('*').single();
  fail(error);

  try {
    const reviewResult = await upsertReview(user, data.id, {
      rating,
      review,
      recommend: body.recommend !== false,
    });
    return {
      book: reviewResult.book,
      review: reviewResult.review,
      message: 'Livro adicionado ao Armarium com sua review.',
    };
  } catch (error) {
    const { error: cleanupError } = await db()
      .from('books')
      .delete()
      .eq('id', data.id)
      .eq('submitted_by', user.id);
    if (cleanupError) console.error('Falha ao desfazer livro incompleto:', cleanupError.message);
    throw error;
  }
}

async function saveBook(req, bookId) {
  const user = await requireUser(req);
  const body = await readJson(req);
  if (bookId === 'new' && body.action === 'create') return createBook(user, body);
  if (body.action === 'review') return upsertReview(user, bookId, body);

  const shelfStatus = SHELF_STATUSES.has(body.shelfStatus) ? body.shelfStatus : 'want_to_read';
  const { data: book, error: bookError } = await db()
    .from('books')
    .select('id')
    .eq('id', bookId)
    .maybeSingle();
  fail(bookError);
  if (!book) badRequest('Livro não encontrado.', 404);
  const saved = await upsertShelf(user.id, bookId, shelfStatus);
  return { saved: S.bookSave(saved), message: 'Estante atualizada.' };
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

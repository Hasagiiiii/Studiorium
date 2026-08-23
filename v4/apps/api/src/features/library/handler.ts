import {
  createBookWithReviewAtomic,
  excludedUserIdsForViewer,
  findBookById,
  findBookByTitleAuthor,
  findBookReview,
  findBookSave,
  listReviewsForBook,
  removeBookFromShelf,
  saveBookReviewAtomic,
  saveBookToShelf,
} from '@lorion/database';
import {
  bookDetailSchema,
  bookReviewMutationSchema,
  bookSaveSchema,
  createBookInputSchema,
  createBookResultSchema,
  removeBookResultSchema,
  reviewBookInputSchema,
  saveBookInputSchema,
  type BookDetail,
  type BookReviewMutation,
  type BookSave,
  type CreateBookResult,
  type RemoveBookResult,
} from '@lorion/contracts';
import { publicSessionUser, requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import { assertPublishableText } from '../../core/moderation/text.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

function decodeId(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

function normalizeIsbn(value: string): string {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase().slice(0, 13);
}

function optionalHttpsUrl(value: string, label: string): string {
  const raw = value.trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('invalid');
    return parsed.toString().slice(0, 1000);
  } catch {
    throw badRequest(`${label} precisa usar um endereço HTTPS válido.`);
  }
}

function amazonPurchaseUrl(title: string, author: string): string {
  const url = new URL('https://www.amazon.com.br/s');
  url.searchParams.set('k', `${title} ${author}`.trim());
  const affiliateTag = String(process.env.STUDIORIUM_AMAZON_AFFILIATE_TAG || '').trim().slice(0, 80);
  if (affiliateTag) url.searchParams.set('tag', affiliateTag);
  return url.toString();
}

async function reviewerName(request: ApiRequest): Promise<string> {
  const account = await requireSessionUser(request);
  if (account.is_minor) return 'Membro da comunidade';
  const publicUser = await publicSessionUser(request);
  return (publicUser?.displayName || publicUser?.username || 'Membro da comunidade').slice(0, 120);
}

export async function bookDetail(request: ApiRequest, rawBookId: string): Promise<BookDetail> {
  const bookId = decodeId(rawBookId);
  if (!bookId) throw notFound('Livro não encontrado.');
  const viewer = await sessionUser(request);
  const [book, reviewsRaw, save, ownReview, excludedRaw] = await Promise.all([
    findBookById(bookId),
    listReviewsForBook(bookId),
    viewer ? findBookSave(bookId, viewer.id) : Promise.resolve(null),
    viewer ? findBookReview(bookId, viewer.id) : Promise.resolve(null),
    viewer ? excludedUserIdsForViewer(viewer.id) : Promise.resolve([]),
  ]);
  if (!book) throw notFound('Livro não encontrado.');
  const excluded = new Set(excludedRaw);
  const reviews = reviewsRaw.filter((review) => review.userId === viewer?.id || !excluded.has(review.userId));
  return bookDetailSchema.parse({
    book,
    reviews,
    viewerShelfStatus: save?.shelfStatus || null,
    viewerReview: ownReview,
  });
}

export async function saveBook(request: ApiRequest, rawBookId: string): Promise<BookSave> {
  const user = await requireSessionUser(request);
  const bookId = decodeId(rawBookId);
  if (!bookId || !(await findBookById(bookId))) throw notFound('Livro não encontrado.');
  const parsed = saveBookInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Estado da estante inválido.');
  const saved = await saveBookToShelf(user.id, bookId, parsed.data.shelfStatus);
  return bookSaveSchema.parse({
    bookId: saved.book_id,
    shelfStatus: saved.shelf_status,
    savedAt: saved.created_at,
  });
}

export async function removeBook(request: ApiRequest, rawBookId: string): Promise<RemoveBookResult> {
  const user = await requireSessionUser(request);
  const bookId = decodeId(rawBookId);
  if (!bookId) throw notFound('Livro não encontrado.');
  const removed = await removeBookFromShelf(user.id, bookId);
  return removeBookResultSchema.parse({ removed, bookId });
}

export async function reviewBook(
  request: ApiRequest,
  rawBookId: string,
): Promise<BookReviewMutation> {
  const user = await requireSessionUser(request);
  const bookId = decodeId(rawBookId);
  if (!bookId || !(await findBookById(bookId))) throw notFound('Livro não encontrado.');
  const parsed = reviewBookInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Informe nota de 1 a 5 e uma review com pelo menos 10 caracteres.');
  assertPublishableText(parsed.data.review, 'Review');
  if (!(await saveBookReviewAtomic(user.id, await reviewerName(request), bookId, parsed.data))) {
    throw new HttpError(409, 'Não foi possível salvar a review.', 'BOOK_REVIEW_NOT_SAVED');
  }
  const [book, review] = await Promise.all([findBookById(bookId), findBookReview(bookId, user.id)]);
  if (!book || !review) throw new Error('Review salva, mas os dados atualizados não foram encontrados.');
  return bookReviewMutationSchema.parse({ book, review });
}

export async function createBook(request: ApiRequest): Promise<CreateBookResult> {
  const user = await requireSessionUser(request);
  const parsed = createBookInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados do livro e a review.');
  assertPublishableText(`${parsed.data.title}\n${parsed.data.author}\n${parsed.data.description}`, 'Livro');
  assertPublishableText(parsed.data.review, 'Review');
  if (await findBookByTitleAuthor(parsed.data.title, parsed.data.author)) {
    throw new HttpError(409, 'Esse livro já existe na Biblioteca. Abra o registro e publique sua review.', 'BOOK_EXISTS');
  }

  const isbn = normalizeIsbn(parsed.data.isbn);
  const suppliedCover = optionalHttpsUrl(parsed.data.coverUrl, 'A URL da capa');
  const suppliedPurchase = optionalHttpsUrl(parsed.data.purchaseUrl, 'A URL de compra');
  const coverUrl =
    suppliedCover ||
    (isbn.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg` : '');
  const purchaseUrl = suppliedPurchase || amazonPurchaseUrl(parsed.data.title, parsed.data.author);
  const purchaseLabel = suppliedPurchase
    ? parsed.data.purchaseLabel || 'Ver edição / comprar'
    : 'Buscar edição na Amazon';
  const bookId = entityId('book');
  const createdId = await createBookWithReviewAtomic(
    bookId,
    user.id,
    await reviewerName(request),
    parsed.data,
    { isbn, coverUrl, purchaseUrl, purchaseLabel },
  );
  if (!createdId) {
    throw new HttpError(409, 'Esse livro já existe ou não pôde ser criado.', 'BOOK_EXISTS');
  }
  const [book, review] = await Promise.all([findBookById(createdId), findBookReview(createdId, user.id)]);
  if (!book || !review) throw new Error('Livro criado, mas os dados atualizados não foram encontrados.');
  return createBookResultSchema.parse({ book, review });
}

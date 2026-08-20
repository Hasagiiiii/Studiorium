import { state, E, html } from './runtime.js';

function stars(value) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

function fallbackCover(book) {
  return html`<span class="book-cover-fallback">
    <small>Studiorium</small>
    <strong>${E(book.title)}</strong>
    <em>${E(book.author)}</em>
  </span>`;
}

function compactBookCard(book) {
  const reviews = Number(book.reviewCount || 0);
  return html`<a
    href="/livros/${encodeURIComponent(book.id)}"
    data-link
    class="book-shelf-item"
    aria-label="Abrir ${E(book.title)}"
  >
    <figure class="book-shelf-cover theme-${E(book.coverTheme || 'umber')}">
      ${book.coverUrl
        ? html`<img
            src="${E(book.coverUrl)}"
            alt="Capa de ${E(book.title)}"
            loading="lazy"
            referrerpolicy="no-referrer"
            data-book-cover-image
          />`
        : ''}
      ${fallbackCover(book)}
    </figure>
    <div class="book-shelf-caption">
      <h3>${E(book.title)}</h3>
      <p>${E(book.author)}</p>
      <div class="book-shelf-score">
        <span>${stars(book.ratingAverage)}</span>
        <small>${reviews ? `${reviews} review${reviews === 1 ? '' : 's'}` : 'Sem reviews'}</small>
      </div>
    </div>
  </a>`;
}

function resolveBook(card) {
  const enhancedId = card.dataset.bookId;
  const source = card.querySelector('[data-book-save]')?.dataset.bookSave || '';
  const sourceId = source.split(':')[0];
  const id = enhancedId || sourceId;
  return (state.boot?.books || []).find((book) => book.id === id);
}

function compactShelf() {
  if (!['/biblioteca', '/library'].includes(location.pathname)) return;
  const shelf = document.querySelector('.book-shelf');
  if (!shelf || shelf.dataset.catalogCompact === 'true') return;

  const cards = [...shelf.querySelectorAll(':scope > .book-card')];
  if (!cards.length) return;
  const books = cards.map(resolveBook).filter(Boolean);
  if (!books.length) return;

  shelf.innerHTML = books.map(compactBookCard).join('');
  shelf.dataset.catalogCompact = 'true';
}

function bindCoverFallbacks() {
  document.querySelectorAll('[data-book-cover-image]').forEach((image) => {
    if (image.dataset.fallbackBound === 'true') return;
    image.dataset.fallbackBound = 'true';
    image.addEventListener('error', () => image.remove(), { once: true });
  });
}

function applyBookCatalog() {
  compactShelf();
  bindCoverFallbacks();
}

export function installBookCatalog() {
  const root = document.getElementById('app');
  if (!root) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyBookCatalog();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();
}

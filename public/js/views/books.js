import { state, E, html } from '../runtime.js';
import { layout, link, notFound } from './core.js';

function stars(value) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

function cover(book, className = 'book-detail-cover') {
  return html`<figure class="${className} theme-${E(book.coverTheme || 'umber')}">
    ${book.coverUrl
      ? html`<img
          src="${E(book.coverUrl)}"
          alt="Capa de ${E(book.title)}"
          loading="eager"
          referrerpolicy="no-referrer"
          data-book-cover-image
        />`
      : ''}
    <span class="book-cover-fallback">
      <small>Studiorium</small>
      <strong>${E(book.title)}</strong>
      <em>${E(book.author)}</em>
    </span>
  </figure>`;
}

function reviewList(bookId) {
  return (state.boot?.bookReviews || []).filter((review) => review.bookId === bookId);
}

export function bookDetail(bookId) {
  const book = (state.boot?.books || []).find((item) => item.id === bookId);
  if (!book) return notFound();

  const reviews = reviewList(book.id);
  const reviewCount = Number(book.reviewCount || reviews.length || 0);
  const recommendations = Number(book.recommendationCount || 0);

  layout(
    html`<section class="pagehero book-detail-page">
        <div class="shell">
          <div class="book-detail-back">
            ${link('/biblioteca?tipo=livros', '← Voltar à estante', 'linkbtn')}
          </div>
          <article class="book-detail-layout">
            <aside class="book-detail-aside">
              ${cover(book)}
              <div class="book-detail-score" aria-label="Avaliação da comunidade">
                <span class="book-stars">${stars(book.ratingAverage)}</span>
                <strong>${Number(book.ratingAverage || 0).toFixed(reviewCount ? 1 : 0)}</strong>
                <small>${reviewCount} review${reviewCount === 1 ? '' : 's'}</small>
              </div>
            </aside>

            <div class="book-detail-copy">
              <div class="eyebrow">${E(book.category || 'Leitura da comunidade')}</div>
              <h1 class="pagetitle">${E(book.title)}</h1>
              <p class="book-detail-author">${E(book.author)}</p>
              <p class="book-detail-description">
                ${E(
                  book.description ||
                    'A comunidade ainda não adicionou uma descrição para esta obra.',
                )}
              </p>

              <div class="book-detail-facts">
                <span><strong>${reviewCount}</strong> reviews</span>
                <span><strong>${recommendations}</strong> recomendações</span>
                ${book.isbn ? html`<span><strong>ISBN</strong> ${E(book.isbn)}</span>` : ''}
              </div>

              <div class="book-detail-actions">
                <button class="soft" type="button" data-book-save="${E(book.id)}:want_to_read">
                  Quero ler
                </button>
                <button class="soft" type="button" data-book-save="${E(book.id)}:reading">
                  Lendo
                </button>
                <button class="outline" type="button" data-book-save="${E(book.id)}:read">
                  Já li
                </button>
                <button class="outline" type="button" data-book-review-open="${E(book.id)}">
                  Fazer review
                </button>
                ${book.purchaseUrl
                  ? html`<a
                      class="book-buy"
                      href="${E(book.purchaseUrl)}"
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      >${E(book.purchaseLabel || 'Ver edição / comprar')} ↗</a
                    >`
                  : ''}
              </div>

              <form class="book-review-form hidden" data-book-review-form="${E(book.id)}">
                <div class="formgrid compact-fields">
                  <select class="select" name="rating" aria-label="Nota" required>
                    <option value="5">5 — Excelente</option>
                    <option value="4">4 — Muito bom</option>
                    <option value="3">3 — Bom</option>
                    <option value="2">2 — Regular</option>
                    <option value="1">1 — Não gostei</option>
                  </select>
                  <label class="armarium-check">
                    <input type="checkbox" name="recommend" checked /> Recomendo
                  </label>
                </div>
                <textarea
                  class="textarea"
                  name="review"
                  minlength="10"
                  maxlength="2400"
                  required
                  placeholder="Escreva sua review desta leitura…"
                ></textarea>
                <button class="solid" type="button" data-book-review-save>Publicar review</button>
              </form>
            </div>
          </article>
        </div>
      </section>

      <section class="section compact book-reviews-section">
        <div class="shell">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Lectiones communitatis</div>
              <h2>Reviews da comunidade</h2>
              <p>Opiniões de quem registrou a leitura no Studiorium.</p>
            </div>
          </div>
          <div class="book-detail-reviews">
            ${reviews.length
              ? reviews
                  .map(
                    (review) =>
                      html`<article class="card book-detail-review">
                        <div class="book-detail-review-head">
                          <strong>${E(review.reviewerName)}</strong>
                          <span class="book-stars">${stars(review.rating)}</span>
                        </div>
                        <p>${E(review.review)}</p>
                        ${review.recommend
                          ? html`<span class="badge">Recomenda esta leitura</span>`
                          : html`<span class="badge">Não marcou recomendação</span>`}
                      </article>`,
                  )
                  .join('')
              : html`<div class="empty">Ainda não há reviews publicadas para esta obra.</div>`}
          </div>
        </div>
      </section>`,
  );
}

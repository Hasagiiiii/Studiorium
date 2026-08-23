import { state, E, html } from '../runtime.js';

const shelfLabels = {
  want_to_read: 'Quero ler',
  reading: 'Lendo',
  read: 'Lido',
};

function stars(value) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

function armariumPanel() {
  return html`<section class="armarium-community" data-armarium-community>
    <div class="armarium-community-head">
      <div>
        <span class="eyebrow">Armarium Librorum</span>
        <h2>Leituras da comunidade</h2>
        <p>
          Inclua livros que você leu, publique reviews e abra discussões sobre obras, autores e
          temas relevantes.
        </p>
      </div>
      <span class="armarium-seal" aria-hidden="true">AL</span>
    </div>
    ${state.me
      ? html`<details class="armarium-add">
          <summary>Adicionar livro lido</summary>
          <form data-book-create-form>
            <div class="formgrid">
              <div>
                <label class="label">Título</label>
                <input class="field" name="title" maxlength="180" required />
              </div>
              <div>
                <label class="label">Autor</label>
                <input class="field" name="author" maxlength="160" required />
              </div>
            </div>
            <div class="formgrid">
              <div>
                <label class="label">ISBN</label>
                <input
                  class="field"
                  name="isbn"
                  maxlength="32"
                  placeholder="Opcional — tenta buscar a capa automaticamente"
                />
              </div>
              <div>
                <label class="label">Categoria</label>
                <input
                  class="field"
                  name="category"
                  maxlength="80"
                  placeholder="Literatura, História, Ciências…"
                />
              </div>
            </div>
            <div class="formrow">
              <label class="label">Sobre o livro</label>
              <textarea
                class="textarea"
                name="description"
                maxlength="1400"
                placeholder="Uma descrição curta e útil, sem copiar sinopses longas de terceiros."
              ></textarea>
            </div>
            <div class="formgrid">
              <div>
                <label class="label">URL HTTPS da capa</label>
                <input
                  class="field"
                  name="coverUrl"
                  type="url"
                  inputmode="url"
                  placeholder="Opcional; o ISBN pode preencher a capa"
                />
              </div>
              <div>
                <label class="label">Link HTTPS de compra / afiliado</label>
                <input
                  class="field"
                  name="purchaseUrl"
                  type="url"
                  inputmode="url"
                  placeholder="Amazon, editora, livraria ou outro parceiro"
                />
              </div>
            </div>
            <div class="formgrid">
              <div>
                <label class="label">Nota</label>
                <select class="select" name="rating" required>
                  <option value="5">5 — Excelente</option>
                  <option value="4">4 — Muito bom</option>
                  <option value="3">3 — Bom</option>
                  <option value="2">2 — Regular</option>
                  <option value="1">1 — Não gostei</option>
                </select>
              </div>
              <label class="armarium-check">
                <input type="checkbox" name="recommend" checked />
                <span>Eu recomendo esta leitura</span>
              </label>
            </div>
            <div class="formrow">
              <label class="label">Minha review</label>
              <textarea
                class="textarea"
                name="review"
                minlength="10"
                maxlength="2400"
                required
                placeholder="O que você leu, o que achou e para quem recomendaria?"
              ></textarea>
            </div>
            <div class="armarium-disclosure">
              Links externos de compra são identificados como links patrocinados/afiliados quando
              usados. O Studiorium não altera a review por existir um link comercial.
            </div>
            <div class="actions">
              <button class="solid" type="button" data-book-create>Catalogar no Armarium</button>
            </div>
          </form>
        </details>`
      : html`<div class="notice">
          Entre na sua conta para adicionar um livro que você leu, publicar a review e montar sua
          estante pessoal.
        </div>`}
    ${state.boot?.books?.length
      ? ''
      : html`<div class="armarium-empty">
          <strong>Nenhum livro adicionado ainda.</strong>
          <span>Inclua uma leitura para começar a estante da comunidade.</span>
        </div>`}
  </section>`;
}

function bookReviews(bookId) {
  return (state.boot?.bookReviews || []).filter((review) => review.bookId === bookId).slice(0, 2);
}

function enhanceBookCard(card) {
  if (card.dataset.armariumEnhanced === 'true') return;
  const existingSave = card.querySelector('[data-book-save]');
  if (!existingSave) return;
  const [bookId] = existingSave.dataset.bookSave.split(':');
  const book = (state.boot?.books || []).find((item) => item.id === bookId);
  if (!book) return;
  card.dataset.armariumEnhanced = 'true';
  card.dataset.bookId = bookId;

  const cover = card.querySelector('.book-cover');
  if (cover && book.coverUrl) {
    cover.outerHTML = html`<figure class="book-cover-real">
      <img
        src="${E(book.coverUrl)}"
        alt="Capa de ${E(book.title)}"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <figcaption>${E(book.title)}</figcaption>
    </figure>`;
    const image = card.querySelector('.book-cover-real img');
    image?.addEventListener('error', () => {
      image.closest('.book-cover-real')?.classList.add('cover-failed');
      image.remove();
    });
  }

  const copy = card.querySelector('.book-copy');
  if (!copy) return;
  existingSave.remove();
  const reviews = bookReviews(bookId);
  copy.insertAdjacentHTML(
    'beforeend',
    html`<div class="book-metrics" aria-label="Avaliação da comunidade">
        <span class="book-stars">${stars(book.ratingAverage)}</span>
        <strong>${Number(book.ratingAverage || 0).toFixed(book.reviewCount ? 1 : 0)}</strong>
        <span>
          ${Number(book.reviewCount || 0)} review${Number(book.reviewCount || 0) === 1 ? '' : 's'}
        </span>
        <span>
          ${Number(book.recommendationCount || 0)}
          recomendaç${Number(book.recommendationCount || 0) === 1 ? 'ão' : 'ões'}
        </span>
      </div>
      <div class="book-actions-grid">
        <button class="soft" type="button" data-book-save="${E(bookId)}:want_to_read">
          Quero ler
        </button>
        <button class="soft" type="button" data-book-save="${E(bookId)}:reading">Lendo</button>
        <button class="outline" type="button" data-book-save="${E(bookId)}:read">Já li</button>
        <button class="outline" type="button" data-book-review-open="${E(bookId)}">
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
      ${book.purchaseUrl
        ? html`<small class="affiliate-note">Link externo comercial/afiliado.</small>`
        : ''}
      <form class="book-review-form hidden" data-book-review-form="${E(bookId)}">
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
      ${reviews.length
        ? html`<div class="book-review-list">
            ${reviews
              .map(
                (review) =>
                  html`<blockquote>
                    <div>
                      <strong>${E(review.reviewerName)}</strong>
                      <span>${stars(review.rating)}${review.recommend ? ' · recomenda' : ''}</span>
                    </div>
                    <p>${E(review.review)}</p>
                  </blockquote>`,
              )
              .join('')}
          </div>`
        : html`<div class="book-no-review">Seja a próxima pessoa a registrar uma leitura.</div>`}`,
  );
}

function enhanceMiniShelf() {
  document.querySelectorAll('.mini-book').forEach((item) => {
    if (item.dataset.armariumEnhanced === 'true') return;
    const remove = item.querySelector('[data-book-remove]');
    if (!remove) return;
    const book = (state.boot?.books || []).find(
      (candidate) => candidate.id === remove.dataset.bookRemove,
    );
    if (!book) return;
    item.dataset.armariumEnhanced = 'true';
    const small = item.querySelector('small');
    if (small) {
      const status = small.textContent.split('·').pop().trim();
      small.textContent = `${book.author} · ${shelfLabels[status] || status}`;
    }
    if (book.coverUrl) {
      item.insertAdjacentHTML(
        'afterbegin',
        html`<img
          class="mini-book-cover"
          src="${E(book.coverUrl)}"
          alt="Capa de ${E(book.title)}"
          loading="lazy"
          referrerpolicy="no-referrer"
        />`,
      );
      const image = item.querySelector('.mini-book-cover');
      image?.addEventListener('error', () => image.remove());
    }
  });
}

export function enhanceArmarium() {
  if (['/biblioteca', '/library'].includes(location.pathname)) {
    const shell = document.querySelector('.library-hero .shell');
    const filter = shell?.querySelector('.library-filter');
    if (shell && filter && !shell.querySelector('[data-armarium-community]')) {
      filter.insertAdjacentHTML('afterend', armariumPanel());
    }
  }
  document.querySelectorAll('.book-card').forEach(enhanceBookCard);
  enhanceMiniShelf();
}

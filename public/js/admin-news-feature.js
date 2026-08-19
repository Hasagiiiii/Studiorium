import { api, date, E, html } from './runtime.js';

let loading = false;

function publishedNewsMarkup(articles) {
  if (!articles.length) {
    return html`<div class="empty">Nenhuma notícia publicada ainda.</div>`;
  }

  return articles
    .map(
      (article) => html`<div class="admin-row">
        <div>
          <strong>${E(article.title)}</strong>
          <small>
            ${E(article.category)} · ${date(article.publishedAt)}
            ${article.featured ? ' · Destaque na página inicial' : ''}
          </small>
        </div>
        <div class="actions">
          <a
            href="/noticias/${encodeURIComponent(article.slug)}"
            data-link
            class="outline"
          >Abrir</a>
          <button
            type="button"
            class="${article.featured ? 'soft' : 'solid'}"
            data-admin-news-feature="${E(article.id)}:${article.featured ? 'false' : 'true'}"
          >
            ${article.featured ? 'Remover destaque' : 'Destacar na página inicial'}
          </button>
        </div>
      </div>`,
    )
    .join('');
}

async function enhanceAdminNews() {
  if (location.pathname.replace(/\/+$/, '') !== '/admin/noticias') return;
  const shell = document.querySelector('.admin-page .shell');
  if (!shell || shell.querySelector('[data-featured-news-admin]') || loading) return;

  loading = true;
  try {
    const data = await api('/api/admin/news');
    if (location.pathname.replace(/\/+$/, '') !== '/admin/noticias') return;
    const currentShell = document.querySelector('.admin-page .shell');
    if (!currentShell || currentShell.querySelector('[data-featured-news-admin]')) return;

    const published = (data.articles || [])
      .filter((article) => article.status === 'published' && !article.deletedAt)
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')),
      );

    const section = document.createElement('section');
    section.className = 'card';
    section.dataset.featuredNewsAdmin = '';
    section.innerHTML = html`<div class="sectionhead">
        <div>
          <div class="eyebrow">Nuntii in prima pagina</div>
          <h2>Notícias publicadas</h2>
          <p>Escolha quais matérias terão prioridade na página inicial.</p>
        </div>
      </div>
      <div>${publishedNewsMarkup(published)}</div>`;
    currentShell.append(section);
  } finally {
    loading = false;
  }
}

export function installAdminNewsFeature() {
  void enhanceAdminNews();
  const root = document.getElementById('app');
  if (!root) return;
  const observer = new MutationObserver(() => {
    void enhanceAdminNews();
  });
  observer.observe(root, { childList: true, subtree: true });
}

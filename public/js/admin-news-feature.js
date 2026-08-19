import { api, date, E, html, toast } from './runtime.js';
import { confirmAction, formDialog, withBusyControl } from './ui-feedback.js';

let loading = false;
let eventsInstalled = false;
let articlesById = new Map();

function sourceText(article) {
  return (article.sources || []).map((source) => `${source.title} | ${source.url}`).join('\n');
}

function parseSources(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('|');
      if (separator < 1) return null;
      const title = line.slice(0, separator).trim();
      const url = line.slice(separator + 1).trim();
      return title && /^https?:\/\//i.test(url) ? { title, url } : null;
    })
    .filter(Boolean);
}

function newsRow(article, mode) {
  const publicLink =
    mode === 'published'
      ? html`<a href="/noticias/${encodeURIComponent(article.slug)}" data-link class="outline"
          >Abrir</a
        >`
      : '';
  const featureButton =
    mode === 'published'
      ? html`<button
          type="button"
          class="${article.featured ? 'soft' : 'solid'}"
          data-news-manager-action="feature:${E(article.id)}:${article.featured ? 'false' : 'true'}"
        >
          ${article.featured ? 'Remover destaque' : 'Destacar'}
        </button>`
      : '';
  const publishButton =
    mode === 'archived'
      ? html`<button
          type="button"
          class="solid"
          data-news-manager-action="publish:${E(article.id)}"
        >
          Publicar novamente
        </button>`
      : '';
  const archiveButton =
    mode === 'published'
      ? html`<button
          type="button"
          class="soft"
          data-news-manager-action="archive:${E(article.id)}"
        >
          Arquivar
        </button>`
      : '';
  const trashButtons =
    mode === 'trash'
      ? html`<button
          type="button"
          class="outline"
          data-news-manager-action="restore:${E(article.id)}"
        >
          Restaurar
        </button>
        <button
          type="button"
          class="dangerbtn"
          data-news-manager-action="purge:${E(article.id)}"
        >
          Excluir definitivamente
        </button>`
      : html`<button
          type="button"
          class="dangerbtn"
          data-news-manager-action="trash:${E(article.id)}"
        >
          Excluir
        </button>`;
  const editButton =
    mode === 'trash'
      ? ''
      : html`<button
          type="button"
          class="outline"
          data-news-manager-action="edit:${E(article.id)}"
        >
          Editar
        </button>`;

  return html`<div class="admin-row published-vault-row">
    <div>
      <strong>${E(article.title)}</strong>
      <small>
        ${E(article.category)} · ${date(article.publishedAt || article.updatedAt || article.createdAt)}
        ${article.featured ? ' · Destaque na página inicial' : ''}
      </small>
    </div>
    <div class="actions">
      ${publicLink}${editButton}${featureButton}${publishButton}${archiveButton}${trashButtons}
    </div>
  </div>`;
}

function vault(label, eyebrow, articles, mode, open = false) {
  const rows = articles.length
    ? articles.map((article) => newsRow(article, mode)).join('')
    : '<div class="empty">Nenhum item nesta área.</div>';
  return html`<details class="card published-vault" data-news-vault="${E(mode)}" ${open ? 'open' : ''}>
    <summary class="published-vault-summary">
      <span>
        <span class="eyebrow">${E(eyebrow)}</span>
        <strong>${E(label)}</strong>
      </span>
      <span class="badge">${articles.length}</span>
    </summary>
    <div class="published-vault-body">${rows}</div>
  </details>`;
}

async function editArticle(article, button) {
  const result = await formDialog({
    title: 'Editar notícia',
    message:
      article.status === 'published'
        ? 'A edição é feita pela administração e mantém a notícia publicada.'
        : 'Revise o conteúdo antes de salvar.',
    confirmLabel: 'Salvar alterações',
    fields: [
      { name: 'title', label: 'Título', value: article.title, required: true, maxLength: 180 },
      {
        name: 'category',
        label: 'Categoria',
        value: article.category,
        required: true,
        maxLength: 80,
      },
      {
        name: 'summary',
        label: 'Resumo',
        type: 'textarea',
        value: article.summary,
        required: true,
        maxLength: 1000,
      },
      {
        name: 'body',
        label: 'Texto completo',
        type: 'textarea',
        value: article.body,
        required: true,
        maxLength: 60_000,
      },
      {
        name: 'sourcesText',
        label: 'Fontes — uma por linha no formato Nome | https://link',
        type: 'textarea',
        value: sourceText(article),
        required: article.status === 'published',
        maxLength: 12_000,
      },
    ],
  });
  if (!result) return;
  const sources = parseSources(result.sourcesText);
  if (article.status === 'published' && sources.length < 2) {
    toast('Mantenha pelo menos duas fontes válidas na notícia publicada.', true);
    return;
  }
  await withBusyControl(button, 'Salvando…', async () => {
    const data = await api(`/api/admin/news/articles/${encodeURIComponent(article.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'edit',
        title: result.title,
        category: result.category,
        summary: result.summary,
        body: result.body,
        sources,
      }),
    });
    toast(data.message || 'Notícia atualizada.');
  });
}

async function publishAgain(article, button) {
  const result = await formDialog({
    title: 'Publicar novamente',
    message: 'A notícia volta para a área pública e pode ser destacada depois.',
    confirmLabel: 'Publicar',
    fields: [
      {
        name: 'note',
        label: 'Nota editorial',
        type: 'textarea',
        required: article.aiReviewStatus !== 'approved',
        maxLength: 2000,
      },
    ],
  });
  if (!result) return;
  await withBusyControl(button, 'Publicando…', async () => {
    await api(`/api/admin/news/articles/${encodeURIComponent(article.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published', note: result.note || '' }),
    });
    toast('Notícia publicada novamente.');
  });
}

async function simpleAction(action, article, button, extra = {}) {
  const endpoint = `/api/admin/news/articles/${encodeURIComponent(article.id)}`;
  if (action === 'feature') {
    await withBusyControl(button, 'Atualizando…', async () => {
      await api(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ featured: extra.featured }),
      });
      toast(extra.featured ? 'Notícia destacada.' : 'Destaque removido.');
    });
    return;
  }
  if (action === 'archive') {
    const confirmed = await confirmAction('Arquivar esta notícia e retirá-la da área pública?', {
      title: 'Arquivar notícia',
      confirmLabel: 'Arquivar',
    });
    if (!confirmed) return;
    await withBusyControl(button, 'Arquivando…', async () => {
      await api(endpoint, { method: 'PATCH', body: JSON.stringify({ status: 'archived' }) });
      toast('Notícia arquivada.');
    });
    return;
  }
  if (action === 'trash') {
    const confirmed = await confirmAction(
      'Mover esta notícia para a lixeira? Ela sairá do ar e poderá ser restaurada depois.',
      { title: 'Excluir notícia', confirmLabel: 'Mover para a lixeira', danger: true },
    );
    if (!confirmed) return;
    await withBusyControl(button, 'Excluindo…', async () => {
      const data = await api(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'trash' }),
      });
      toast(data.message || 'Notícia movida para a lixeira.');
    });
    return;
  }
  if (action === 'restore') {
    await withBusyControl(button, 'Restaurando…', async () => {
      const data = await api(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'restore' }),
      });
      toast(data.message || 'Notícia restaurada.');
    });
    return;
  }
  if (action === 'purge') {
    const confirmed = await confirmAction(
      'Excluir definitivamente esta notícia? Esta ação não pode ser desfeita.',
      { title: 'Exclusão definitiva', confirmLabel: 'Excluir definitivamente', danger: true },
    );
    if (!confirmed) return;
    await withBusyControl(button, 'Excluindo…', async () => {
      const data = await api(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'purge' }),
      });
      toast(data.message || 'Notícia excluída definitivamente.');
    });
  }
}

async function refreshManager() {
  document.querySelector('[data-news-library-admin]')?.remove();
  articlesById = new Map();
  loading = false;
  await enhanceAdminNews();
}

async function handleManagerClick(event) {
  const button = event.target.closest('[data-news-manager-action]');
  if (!button) return;
  event.preventDefault();
  const [action, id, rawValue] = button.dataset.newsManagerAction.split(':');
  const article = articlesById.get(id);
  if (!article) return;

  if (action === 'edit') await editArticle(article, button);
  else if (action === 'publish') await publishAgain(article, button);
  else {
    await simpleAction(action, article, button, { featured: rawValue === 'true' });
  }
  await refreshManager();
}

async function enhanceAdminNews() {
  if (location.pathname.replace(/\/+$/, '') !== '/admin/noticias') return;
  const shell = document.querySelector('.admin-page .shell');
  if (!shell || shell.querySelector('[data-news-library-admin]') || loading) return;

  loading = true;
  try {
    const data = await api('/api/admin/news');
    if (location.pathname.replace(/\/+$/, '') !== '/admin/noticias') return;
    const currentShell = document.querySelector('.admin-page .shell');
    if (!currentShell || currentShell.querySelector('[data-news-library-admin]')) return;

    const articles = data.articles || [];
    articlesById = new Map(articles.map((article) => [article.id, article]));
    const published = articles
      .filter((article) => article.status === 'published' && !article.deletedAt)
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')),
      );
    const archived = articles
      .filter((article) => article.status === 'archived' && !article.deletedAt)
      .sort((left, right) => String(right.updatedAt || '').localeCompare(left.updatedAt || ''));
    const trash = articles
      .filter((article) => Boolean(article.deletedAt))
      .sort((left, right) => String(right.updatedAt || '').localeCompare(left.updatedAt || ''));

    const wrapper = document.createElement('section');
    wrapper.dataset.newsLibraryAdmin = '';
    wrapper.className = 'published-vault-stack';
    wrapper.innerHTML = html`${vault(
      'Publicadas',
      'Nuntii publicati',
      published,
      'published',
    )}${vault('Arquivadas', 'Archivum', archived, 'archived')}${vault(
      'Lixeira',
      'Cista',
      trash,
      'trash',
    )}`;
    currentShell.append(wrapper);
  } finally {
    loading = false;
  }
}

export function installAdminNewsFeature() {
  void enhanceAdminNews();
  const root = document.getElementById('app');
  if (!root) return;
  if (!eventsInstalled) {
    eventsInstalled = true;
    document.addEventListener('click', (event) => {
      void handleManagerClick(event);
    });
  }
  const observer = new MutationObserver(() => {
    void enhanceAdminNews();
  });
  observer.observe(root, { childList: true, subtree: true });
}

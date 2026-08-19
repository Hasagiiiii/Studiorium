import { api, E, html } from './runtime.js';

let loading = false;

function publicationEditor(publication) {
  const keywords = Array.isArray(publication.keywords)
    ? publication.keywords.join(', ')
    : publication.keywords || '';

  return html`<details class="review-details admin-content-editor" data-admin-published-editor>
    <summary>Editar publicação</summary>
    <form class="admin-edit-form" data-admin-edit-content="publication:${E(publication.id)}">
      <div class="formgrid">
        <div class="form-span-2">
          <label class="label">Título</label>
          <input class="field" name="title" value="${E(publication.title)}" required />
        </div>
        <div>
          <label class="label">Área</label>
          <input class="field" name="area" value="${E(publication.area || '')}" />
        </div>
        <div>
          <label class="label">Nível</label>
          <input class="field" name="level" value="${E(publication.level || '')}" />
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="abstract" minlength="40" required>
${E(publication.abstract || '')}</textarea
        >
      </div>
      <div class="formrow">
        <label class="label">Texto completo</label>
        <textarea class="textarea article-textarea" name="content">
${E(publication.content || '')}</textarea
        >
      </div>
      <div class="formgrid">
        <div>
          <label class="label">Palavras-chave</label>
          <input class="field" name="keywords" value="${E(keywords)}" />
        </div>
        <div>
          <label class="label">Licença</label>
          <input class="field" name="license" value="${E(publication.license || '')}" />
        </div>
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function techEditor(resource) {
  const tags = Array.isArray(resource.tags) ? resource.tags.join(', ') : resource.tags || '';

  return html`<details class="review-details admin-content-editor" data-admin-published-editor>
    <summary>Editar conteúdo</summary>
    <form class="admin-edit-form" data-admin-edit-content="tech_resource:${E(resource.id)}">
      <div class="formgrid">
        <div class="form-span-2">
          <label class="label">Título</label>
          <input class="field" name="title" value="${E(resource.title)}" required />
        </div>
        <div>
          <label class="label">Área</label>
          <input class="field" name="hub" value="${E(resource.hub || '')}" />
        </div>
        <div>
          <label class="label">Tipo</label>
          <input class="field" name="category" value="${E(resource.category || '')}" />
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="summary" required>${E(resource.summary || '')}</textarea>
      </div>
      <div class="formrow">
        <label class="label">Conteúdo completo</label>
        <textarea class="textarea article-textarea" name="body" required>
${E(resource.body || '')}</textarea
        >
      </div>
      <div class="formrow">
        <label class="label">Tags</label>
        <input class="field" name="tags" value="${E(tags)}" />
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function discussionEditor(discussion) {
  return html`<details class="review-details admin-content-editor" data-admin-published-editor>
    <summary>Editar discussão</summary>
    <form class="admin-edit-form" data-admin-edit-content="discussion:${E(discussion.id)}">
      <div class="formgrid">
        <div class="form-span-2">
          <label class="label">Título</label>
          <input class="field" name="title" value="${E(discussion.title)}" required />
        </div>
        <div>
          <label class="label">Categoria</label>
          <input class="field" name="category" value="${E(discussion.category || '')}" required />
        </div>
      </div>
      <div class="formrow">
        <label class="label">Texto</label>
        <textarea class="textarea article-textarea" name="body" required>
${E(discussion.body || '')}</textarea
        >
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function replyEditor(reply) {
  return html`<details class="review-details admin-content-editor">
    <summary>Editar resposta</summary>
    <form class="admin-edit-form" data-admin-edit-content="reply:${E(reply.id)}">
      <div class="formrow">
        <label class="label">Resposta</label>
        <textarea class="textarea" name="body" required>${E(reply.body || '')}</textarea>
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function findCardByAction(type, id) {
  return [...document.querySelectorAll('[data-admin-content]')]
    .find((button) => button.dataset.adminContent.startsWith(`${type}:${id}:`))
    ?.closest('article.card');
}

function findPublicationCard(id) {
  return [...document.querySelectorAll('[data-admin-feature-publication]')]
    .find((button) => button.dataset.adminFeaturePublication.split(':')[0] === id)
    ?.closest('article.card');
}

function addDeleteAction(card, type, id) {
  const actions = card?.querySelector('.admin-actions');
  if (!actions) return;

  const exists = [...actions.querySelectorAll('[data-admin-delete-content]')].some(
    (button) => button.dataset.adminDeleteContent === `${type}:${id}`,
  );
  if (exists) return;

  actions.insertAdjacentHTML(
    'beforeend',
    html`<button class="dangerbtn" type="button" data-admin-delete-content="${E(type)}:${E(id)}">
      Excluir definitivamente
    </button>`,
  );
}

function enhancePublications(publications) {
  for (const publication of publications.filter((item) => item.status === 'published')) {
    const card = findPublicationCard(publication.id);
    if (!card) continue;

    if (!card.querySelector('[data-admin-published-editor]')) {
      card
        .querySelector('.admin-actions')
        ?.insertAdjacentHTML('beforebegin', publicationEditor(publication));
    }
    addDeleteAction(card, 'publication', publication.id);
  }
}

function enhanceTech(techResources) {
  for (const resource of techResources.filter((item) => item.status === 'published')) {
    const card = findCardByAction('tech_resource', resource.id);
    if (!card) continue;

    if (!card.querySelector('[data-admin-published-editor]')) {
      card.querySelector('.admin-actions')?.insertAdjacentHTML('beforebegin', techEditor(resource));
    }
    addDeleteAction(card, 'tech_resource', resource.id);
  }
}

function enhanceDiscussions(discussions) {
  for (const discussion of discussions) {
    const card = findCardByAction('discussion', discussion.id);
    if (!card) continue;

    if (!card.querySelector('[data-admin-published-editor]')) {
      card
        .querySelector('.admin-actions')
        ?.insertAdjacentHTML('beforebegin', discussionEditor(discussion));
    }
    addDeleteAction(card, 'discussion', discussion.id);
  }
}

function replyRow(reply) {
  const excerpt = String(reply.body || '').slice(0, 220);
  const suffix = String(reply.body || '').length > 220 ? '…' : '';

  return html`<div class="admin-row">
    <div class="min-width-zero">
      <strong>Resposta no Colloquium</strong>
      <small>${E(excerpt)}${suffix}</small>
      ${replyEditor(reply)}
    </div>
    <div class="actions admin-actions">
      <button class="solid" type="button" data-admin-content="reply:${E(reply.id)}:published">
        Publicar
      </button>
      <button
        class="outline"
        type="button"
        data-admin-content="reply:${E(reply.id)}:pending_review"
      >
        Revisar
      </button>
      <button class="dangerbtn" type="button" data-admin-content="reply:${E(reply.id)}:hidden">
        Ocultar
      </button>
      <button class="dangerbtn" type="button" data-admin-delete-content="reply:${E(reply.id)}">
        Excluir definitivamente
      </button>
    </div>
  </div>`;
}

function enhanceReplies(replies) {
  const shell = document.querySelector('.admin-page .shell');
  if (!shell || shell.querySelector('[data-admin-replies-v329]')) return;

  shell.insertAdjacentHTML(
    'beforeend',
    html`<details class="card trash-panel section-gap" data-admin-replies-v329>
      <summary>Respostas do Colloquium (${replies.length})</summary>
      <p class="muted small">Área administrativa recolhida para não ocupar a fila principal.</p>
      ${replies.map(replyRow).join('') || '<div class="empty">Nenhuma resposta encontrada.</div>'}
    </details>`,
  );
}

async function enhanceAdminPublishedActions() {
  const path = location.pathname.replace(/\/+$/, '');
  const supported = ['/admin/publicacoes', '/admin/oficina', '/admin/coloquio'];
  if (!supported.includes(path) || loading) return;

  loading = true;
  try {
    const data = await api('/api/admin/dashboard');
    if (path === '/admin/publicacoes') enhancePublications(data.publications || []);
    if (path === '/admin/oficina') enhanceTech(data.techResources || []);
    if (path === '/admin/coloquio') {
      enhanceDiscussions(data.discussions || []);
      enhanceReplies(data.replies || []);
    }
  } finally {
    loading = false;
  }
}

export function installAdminPublishedActions() {
  void enhanceAdminPublishedActions();
  const root = document.getElementById('app');
  if (!root) return;

  const observer = new MutationObserver(() => {
    void enhanceAdminPublishedActions();
  });
  observer.observe(root, { childList: true, subtree: true });
}

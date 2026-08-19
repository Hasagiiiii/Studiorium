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
        <textarea class="textarea" name="abstract" minlength="40" required>${E(
          publication.abstract || '',
        )}</textarea>
      </div>
      <div class="formrow">
        <label class="label">Texto completo</label>
        <textarea class="textarea article-textarea" name="content">${E(
          publication.content || '',
        )}</textarea>
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
        <textarea class="textarea article-textarea" name="body" required>${E(
          resource.body || '',
        )}</textarea>
      </div>
      <div class="formrow">
        <label class="label">Tags</label>
        <input class="field" name="tags" value="${E(tags)}" />
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function findPublicationCard(id) {
  return [...document.querySelectorAll('[data-admin-feature-publication]')]
    .find((button) => button.dataset.adminFeaturePublication.split(':')[0] === id)
    ?.closest('article.card');
}

function findTechCard(id) {
  return [...document.querySelectorAll('[data-admin-content]')]
    .find((button) => button.dataset.adminContent === `tech_resource:${id}:pending_review`)
    ?.closest('article.card');
}

function addDeleteAction(card, type, id) {
  const actions = card?.querySelector('.admin-actions');
  if (!actions || actions.querySelector(`[data-admin-delete-content="${type}:${CSS.escape(id)}"]`)) {
    return;
  }
  actions.insertAdjacentHTML(
    'beforeend',
    html`<button class="dangerbtn" type="button" data-admin-delete-content="${E(type)}:${E(id)}">
      Excluir definitivamente
    </button>`,
  );
}

function enhancePublished(publications, techResources) {
  for (const publication of publications.filter((item) => item.status === 'published')) {
    const card = findPublicationCard(publication.id);
    if (!card) continue;
    if (!card.querySelector('[data-admin-published-editor]')) {
      card.querySelector('.admin-actions')?.insertAdjacentHTML('beforebegin', publicationEditor(publication));
    }
    addDeleteAction(card, 'publication', publication.id);
  }

  for (const resource of techResources.filter((item) => item.status === 'published')) {
    const card = findTechCard(resource.id);
    if (!card) continue;
    if (!card.querySelector('[data-admin-published-editor]')) {
      card.querySelector('.admin-actions')?.insertAdjacentHTML('beforebegin', techEditor(resource));
    }
    addDeleteAction(card, 'tech_resource', resource.id);
  }
}

async function enhanceAdminPublishedActions() {
  if (!['/admin/publicacoes', '/admin/oficina'].includes(location.pathname.replace(/\/+$/, ''))) {
    return;
  }
  if (loading) return;
  loading = true;
  try {
    const data = await api('/api/admin/dashboard');
    enhancePublished(data.publications || [], data.techResources || []);
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

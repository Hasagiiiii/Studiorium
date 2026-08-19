import { api, E, html, state } from '../runtime.js';
import { empty, link } from './core.js';
import { templateStudio as legacyTemplateStudio } from './template-studio.js';

function templateCard(template) {
  return html`<article class="card studio-card">
    <div class="sectionhead compact-head">
      <span class="eyebrow">${E(template.sourceType)}</span>
      <span class="badge">${E(template.status)}</span>
    </div>
    <div
      class="template-miniature"
      style="--template-bg:${E(template.document?.settings?.background || '#f2eadb')}"
    >
      <span></span><strong>${E(template.title)}</strong><span></span><span></span>
    </div>
    <h3>${E(template.title)}</h3>
    <p>${E(template.description || 'Template livre para personalizar.')}</p>
    <div class="actions">
      ${link(`/estudio-templates/${encodeURIComponent(template.id)}`, 'Editar', 'solid')}
      <button class="dangerbtn" type="button" data-trash-template="${E(template.id)}">
        Excluir
      </button>
    </div>
  </article>`;
}

export async function templateStudio() {
  await legacyTemplateStudio();
  if (!state.me || location.pathname.replace(/\/+$/, '') !== '/estudio-templates') return;

  const { templates } = await api('/api/custom-templates/mine');
  const active = templates.filter((template) => !template.deletedAt);
  const working = active.filter((template) => template.status !== 'published');
  const published = active.filter((template) => template.status === 'published');
  const page = document.querySelector('.studio-page .shell');
  const grid = page?.querySelector('.grid.grid3');
  if (!page || !grid) return;

  grid.innerHTML =
    working.map(templateCard).join('') || empty('Nenhum template em edição ou revisão.');
  const existing = page.querySelector('[data-published-template-vault]');
  if (existing) existing.remove();
  grid.insertAdjacentHTML(
    'afterend',
    html`<details class="card trash-panel section-gap" data-published-template-vault>
      <summary>Publicados (${published.length})</summary>
      <p class="muted small">
        Templates já públicos ficam recolhidos aqui para não ocupar a área de criação.
      </p>
      <div class="grid grid3">
        ${published.map(templateCard).join('') || empty('Nenhum template publicado.')}
      </div>
    </details>`,
  );
}

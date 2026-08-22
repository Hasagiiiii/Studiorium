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

function guidedStart() {
  return html`<section class="card studio-guided-start" aria-labelledby="guided-start-title">
    <div>
      <span class="eyebrow">Criação assistida</span>
      <h2 id="guided-start-title">Comece pela intenção, não pela página em branco.</h2>
      <p>
        Escolha um objetivo e o Studiorium prepara uma estrutura inicial editável. O roteiro é local
        e transparente: não finge geração por IA nem envia seu conteúdo para um provedor externo.
      </p>
    </div>
    <div class="grid grid3 studio-guided-grid">
      <article class="studio-guided-option">
        <span class="project-mini" aria-hidden="true">▤</span>
        <h3>Banner científico</h3>
        <p>Introdução, objetivos, metodologia, resultados, conclusão e referências.</p>
        <button class="outline" type="button" data-guided-template="banner">
          Preparar estrutura
        </button>
      </article>
      <article class="studio-guided-option">
        <span class="project-mini" aria-hidden="true">▱</span>
        <h3>Apresentação</h3>
        <p>Contexto, questão central, evidências e síntese em formato de apresentação.</p>
        <button class="outline" type="button" data-guided-template="slides">
          Preparar estrutura
        </button>
      </article>
      <article class="studio-guided-option">
        <span class="project-mini" aria-hidden="true">✦</span>
        <h3>Material de estudo</h3>
        <p>Conceitos-chave, resumo, prática e fontes para uma revisão organizada.</p>
        <button class="outline" type="button" data-guided-template="estudo">
          Preparar estrutura
        </button>
      </article>
    </div>
  </section>`;
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

  const start = page.querySelector('.studio-start');
  if (start && !page.querySelector('.studio-guided-start')) {
    start.insertAdjacentHTML('beforebegin', guidedStart());
  }

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

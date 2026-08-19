import { api, E, date, html, state } from '../runtime.js';
import { empty, link } from './core.js';
import { escrivaninha as legacyEscrivaninha } from './workspace.js';

function submissionStatus(status) {
  const labels = {
    published: 'Publicado',
    pending_review: 'Em revisão',
    rejected: 'Rejeitado',
    hidden: 'Oculto',
  };
  return labels[status] || status;
}

function cardByEyebrow(label) {
  return [...document.querySelectorAll('.card')].find(
    (card) => card.querySelector(':scope > .eyebrow')?.textContent.trim() === label,
  );
}

function publicationRow(publication, published = false) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(publication.title)}</h3>
      <p>Status: ${E(submissionStatus(publication.status))} · ${date(publication.createdAt)}</p>
    </div>
    <div class="actions">
      ${published
        ? link(`/pesquisas/${encodeURIComponent(publication.slug)}`, 'Abrir', 'outline')
        : ''}
      ${link(
        `/publicar?editar=${encodeURIComponent(publication.id)}`,
        published ? 'Editar' : 'Editar e reenviar',
        'outline',
      )}
      <button
        class="dangerbtn"
        type="button"
        data-delete-publication="${E(publication.id)}"
      >
        Excluir
      </button>
    </div>
  </div>`;
}

function techRow(resource, published = false) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(resource.title)}</h3>
      <p>
        ${E(resource.hub)} · Status: ${E(submissionStatus(resource.status))} ·
        ${date(resource.createdAt)}
      </p>
    </div>
    <div class="actions">
      ${published
        ? link(`/oficina/${encodeURIComponent(resource.slug)}`, 'Abrir', 'outline')
        : ''}
      ${link(
        `/oficina?editar=${encodeURIComponent(resource.id)}`,
        published ? 'Editar' : 'Editar e reenviar',
        'outline',
      )}
      <button
        class="dangerbtn"
        type="button"
        data-delete-tech-resource="${E(resource.id)}"
      >
        Excluir
      </button>
    </div>
  </div>`;
}

function publishedVault(label, items, renderer) {
  return html`<details class="trash-panel workspace-published-vault">
    <summary>${E(label)} (${items.length})</summary>
    <p class="muted small">Itens já públicos ficam recolhidos aqui para não ocupar sua mesa.</p>
    ${items.map((item) => renderer(item, true)).join('') || empty('Nenhum item publicado.')}
  </details>`;
}

function enhancePublications(me) {
  const card = cardByEyebrow('Publicações');
  if (!card) return;
  const items = me.publications || [];
  const working = items.filter((item) => item.status !== 'published');
  const published = items.filter((item) => item.status === 'published');
  card.innerHTML = html`<div class="eyebrow">Publicações</div>
    <h3>Em edição e revisão</h3>
    ${working.map((item) => publicationRow(item)).join('') ||
    empty('Nenhum trabalho em edição ou revisão.')}
    ${publishedVault('Publicadas', published, publicationRow)}`;
}

function enhanceTech(me) {
  const card = cardByEyebrow('Oficina e tecnologia');
  if (!card) return;
  const items = me.techResources || [];
  const working = items.filter((item) => item.status !== 'published');
  const published = items.filter((item) => item.status === 'published');
  card.innerHTML = html`<div class="eyebrow">Oficina e tecnologia</div>
    <h3>Em edição e revisão</h3>
    ${working.map((item) => techRow(item)).join('') ||
    empty('Nenhum conteúdo da Oficina em edição ou revisão.')}
    ${publishedVault('Publicados', published, techRow)}
    <div class="actions" style="margin-top:14px">
      ${link('/oficina?novo=1', 'Enviar conteúdo', 'solid')}
    </div>`;
}

export async function escrivaninha() {
  await legacyEscrivaninha();
  if (!state.me || location.pathname.replace(/\/+$/, '') !== '/escrivaninha') return;
  try {
    const me = await api('/api/me');
    enhancePublications(me);
    enhanceTech(me);
  } catch {
    // A tela base continua funcional caso a atualização complementar falhe.
  }
}

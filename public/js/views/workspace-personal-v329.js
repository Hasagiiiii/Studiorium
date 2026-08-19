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

function publishedVault(label, items, renderer, emptyText = 'Nenhum item publicado.') {
  return html`<details class="trash-panel workspace-published-vault">
    <summary>${E(label)} (${items.length})</summary>
    <p class="muted small">Itens já públicos ficam recolhidos aqui para não ocupar sua mesa.</p>
    ${items.map((item) => renderer(item, true)).join('') || empty(emptyText)}
  </details>`;
}

function projectRow(project, published = false) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(project.title)}</h3>
      <p>
        ${E(project.type)} · ${published ? 'público' : 'privado'} · atualizado
        ${date(project.updatedAt)}
      </p>
    </div>
    <div class="actions">
      ${published ? link(`/projetos/${encodeURIComponent(project.id)}`, 'Abrir', 'outline') : ''}
      ${link(`/editor/${encodeURIComponent(project.id)}`, 'Editar', 'outline')}
      <button class="dangerbtn" type="button" data-delete-project="${E(project.id)}">
        Excluir
      </button>
    </div>
  </div>`;
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
      <button class="dangerbtn" type="button" data-delete-publication="${E(publication.id)}">
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
      ${published ? link(`/oficina/${encodeURIComponent(resource.slug)}`, 'Abrir', 'outline') : ''}
      ${link(
        `/oficina?editar=${encodeURIComponent(resource.id)}`,
        published ? 'Editar' : 'Editar e reenviar',
        'outline',
      )}
      <button class="dangerbtn" type="button" data-delete-tech-resource="${E(resource.id)}">
        Excluir
      </button>
    </div>
  </div>`;
}

function codeRow(project, published = false) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(project.title)}</h3>
      <p>
        ${published ? 'público' : E(project.visibility)} · atualizado ${date(project.updatedAt)}
      </p>
    </div>
    <div class="actions">
      ${link(
        `/laboratorio/${encodeURIComponent(project.id)}`,
        published ? 'Abrir e editar' : 'Codar',
        'outline',
      )}
      <button class="dangerbtn" type="button" data-delete-code-project="${E(project.id)}">
        Excluir
      </button>
    </div>
  </div>`;
}

function discussionRow(item, published = false) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(item.title)}</h3>
      <p>${E(item.category)} · ${E(submissionStatus(item.status))} · ${date(item.createdAt)}</p>
    </div>
    <div class="actions">
      ${published ? link(`/coloquio/${encodeURIComponent(item.id)}`, 'Abrir', 'outline') : ''}
      <button class="outline" type="button" data-edit-own-discussion="${E(item.id)}">Editar</button>
      <button class="dangerbtn" type="button" data-delete-own-discussion="${E(item.id)}">
        Excluir
      </button>
    </div>
  </div>`;
}

function replyRow(item, published = false) {
  const excerpt = String(item.body || '').slice(0, 150);
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>Resposta no Colloquium</h3>
      <p>${E(excerpt)}${String(item.body || '').length > 150 ? '…' : ''}</p>
      <small class="muted">${E(submissionStatus(item.status))} · ${date(item.createdAt)}</small>
    </div>
    <div class="actions">
      ${published
        ? link(`/coloquio/${encodeURIComponent(item.discussionId)}`, 'Abrir conversa', 'outline')
        : ''}
      <button class="outline" type="button" data-edit-own-reply="${E(item.id)}">Editar</button>
      <button class="dangerbtn" type="button" data-delete-own-reply="${E(item.id)}">Excluir</button>
    </div>
  </div>`;
}

function enhanceProjects(me) {
  const card = cardByEyebrow('Projetos');
  if (!card) return;
  const items = (me.projects || []).filter((item) => !item.deletedAt);
  const privateItems = items.filter((item) => item.visibility !== 'public');
  const publicItems = items.filter((item) => item.visibility === 'public');
  card.innerHTML = html`<div class="eyebrow">Projetos</div>
    <h3>Em sua mesa</h3>
    ${privateItems.map((item) => projectRow(item)).join('') ||
    empty('Nenhum projeto privado na mesa.')}
    ${publishedVault('Projetos públicos', publicItems, projectRow, 'Nenhum projeto público.')}`;
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

function enhanceCode(me) {
  const card = cardByEyebrow('Projetos de código');
  if (!card) return;
  const items = (me.codeProjects || []).filter((item) => !item.deletedAt);
  const privateItems = items.filter((item) => item.visibility !== 'public');
  const publicItems = items.filter((item) => item.visibility === 'public');
  card.innerHTML = html`<div class="eyebrow">Projetos de código</div>
    <h3>Studiorium Lab</h3>
    ${privateItems.map((item) => codeRow(item)).join('') ||
    empty('Nenhum projeto privado no laboratório.')}
    ${publishedVault('Código público', publicItems, codeRow, 'Nenhum projeto de código público.')}
    <div class="actions" style="margin-top:14px">
      ${link('/laboratorio', 'Criar projeto de código', 'solid')}
    </div>`;
}

function enhanceColloquium(me) {
  if (document.querySelector('[data-private-colloquium]')) return;
  const discussions = me.discussions || [];
  const replies = me.replies || [];
  const pendingDiscussions = discussions.filter((item) => item.status !== 'published');
  const publicDiscussions = discussions.filter((item) => item.status === 'published');
  const pendingReplies = replies.filter((item) => item.status !== 'published');
  const publicReplies = replies.filter((item) => item.status === 'published');
  const codeCard = cardByEyebrow('Projetos de código');
  if (!codeCard) return;
  codeCard.insertAdjacentHTML(
    'beforebegin',
    html`<div class="card" data-private-colloquium style="margin-top:18px">
      <div class="eyebrow">Colloquium personale</div>
      <h3>Suas discussões e respostas</h3>
      ${pendingDiscussions.map((item) => discussionRow(item)).join('') || ''}
      ${pendingReplies.map((item) => replyRow(item)).join('') || ''}
      ${!pendingDiscussions.length && !pendingReplies.length
        ? empty('Nenhuma contribuição aguardando revisão.')
        : ''}
      ${publishedVault(
        'Discussões publicadas',
        publicDiscussions,
        discussionRow,
        'Nenhuma discussão publicada.',
      )}
      ${publishedVault(
        'Respostas publicadas',
        publicReplies,
        replyRow,
        'Nenhuma resposta publicada.',
      )}
      <div class="actions" style="margin-top:14px">
        ${link('/coloquio', 'Ir ao Colloquium', 'solid')}
      </div>
    </div>`,
  );
}

export async function escrivaninha() {
  await legacyEscrivaninha();
  if (!state.me || location.pathname.replace(/\/+$/, '') !== '/escrivaninha') return;
  try {
    const me = await api('/api/me');
    enhanceProjects(me);
    enhancePublications(me);
    enhanceTech(me);
    enhanceColloquium(me);
    enhanceCode(me);
  } catch {
    // A tela base continua funcional caso a atualização complementar falhe.
  }
}

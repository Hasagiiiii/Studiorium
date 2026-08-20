import { api, E, html, state, num } from '../runtime.js';
import { layout, link, empty, discussionRow } from './core.js';

function communityCard(community) {
  return html`<article class="community-card">
    <div class="community-card-head">
      <div>
        <span class="eyebrow">${E(community.area)}</span>
        <h3>${link(`/comunidades/${encodeURIComponent(community.slug)}`, E(community.name))}</h3>
      </div>
      ${community.official ? '<span class="community-official">Oficial</span>' : ''}
    </div>
    <p>${E(community.description)}</p>
    <div class="community-card-meta">
      <span>${num(community.memberCount || 0)} participantes</span>
      ${community.joined ? '<span class="brass">Você participa</span>' : ''}
    </div>
    <div class="community-card-actions">
      ${link(
        `/comunidades/${encodeURIComponent(community.slug)}`,
        community.joined ? 'Abrir comunidade' : 'Conhecer comunidade',
        'outline',
      )}
    </div>
  </article>`;
}

function groupCommunities(communities) {
  return communities.reduce((groups, community) => {
    const area = community.area || 'Geral';
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area).push(community);
    return groups;
  }, new Map());
}

export async function comunidades() {
  const data = await api('/api/communities');
  const q = String(state.query.get('q') || '').trim().toLowerCase();
  const area = String(state.query.get('area') || '').trim();
  const communities = (data.communities || []).filter((community) => {
    const searchable = `${community.name} ${community.area} ${community.description}`.toLowerCase();
    return (!q || searchable.includes(q)) && (!area || community.area === area);
  });
  const allAreas = [...new Set((data.communities || []).map((community) => community.area))].sort();
  const grouped = groupCommunities(communities);

  layout(html`<section class="pagehero communities-index">
    <div class="shell">
      <div class="communities-intro">
        <div>
          <div class="eyebrow">Communitates</div>
          <h1 class="pagetitle">Comunidades</h1>
          <p>
            Encontre pessoas e conhecimento por assunto. Cada comunidade reúne seu Colóquio,
            tutoriais, projetos e recursos relacionados sem duplicar o conteúdo do Studiorium.
          </p>
        </div>
        <aside class="community-principle">
          <strong>Um assunto, várias formas de contribuir.</strong>
          <span>Discussões, prática, projetos e referências continuam ligados à mesma comunidade.</span>
        </aside>
      </div>

      ${data.storageReady === false
        ? html`<div class="notice community-preview-notice">
            O catálogo de comunidades está disponível neste ambiente, mas participação e vínculos
            persistentes serão ativados junto da migração do banco.
          </div>`
        : ''}

      <form class="community-toolbar" data-community-filter>
        <label>
          <span>Pesquisar</span>
          <input class="field" name="q" value="${E(state.query.get('q') || '')}" placeholder="PC, motos, matemática…" />
        </label>
        <label>
          <span>Área</span>
          <select class="select" name="area">
            <option value="">Todas as áreas</option>
            ${allAreas
              .map(
                (item) =>
                  html`<option value="${E(item)}" ${item === area ? 'selected' : ''}>${E(item)}</option>`,
              )
              .join('')}
          </select>
        </label>
        <button class="solid">Filtrar</button>
        ${q || area ? link('/comunidades', 'Limpar', 'outline') : ''}
      </form>

      ${communities.length
        ? [...grouped.entries()]
            .map(
              ([group, items]) => html`<section class="community-area">
                <div class="sectionhead">
                  <div>
                    <div class="eyebrow">Área</div>
                    <h2>${E(group)}</h2>
                  </div>
                  <span class="muted small">${items.length} comunidade${items.length === 1 ? '' : 's'}</span>
                </div>
                <div class="community-grid">${items.map(communityCard).join('')}</div>
              </section>`,
            )
            .join('')
        : empty('Nenhuma comunidade corresponde a este filtro.')}
    </div>
  </section>`);
}

function techResourceCard(resource) {
  return html`<article class="community-resource-card">
    <span class="eyebrow">${E(resource.category || 'Oficina')}</span>
    <h3>${link(`/oficina/${encodeURIComponent(resource.slug)}`, E(resource.title))}</h3>
    <p>${E(resource.summary || '')}</p>
    <div class="pills">
      ${(resource.tags || [])
        .slice(0, 4)
        .map((tag) => html`<span class="pill">${E(tag)}</span>`)
        .join('')}
    </div>
  </article>`;
}

export async function comunidadeDetalhe(slug, options = {}) {
  const data = await api(`/api/communities/${encodeURIComponent(slug)}`);
  const community = data.community;
  const focus = options.focus || '';
  const discussions = data.discussions || [];
  const resources = data.techResources || [];
  const canonical = `/comunidades/${encodeURIComponent(community.slug)}`;

  layout(html`<section class="pagehero community-detail">
    <div class="shell">
      <div class="crumbs">${link('/comunidades', 'Comunidades')} / ${E(community.area)}</div>

      <header class="community-hero-card">
        <div class="community-hero-copy">
          <div class="eyebrow">${E(community.area)} · Comunidade oficial</div>
          <h1 class="pagetitle">${E(community.name)}</h1>
          <p>${E(community.description)}</p>
          <div class="community-stats">
            <span><strong>${num(community.memberCount || 0)}</strong> participantes</span>
            <span><strong>${discussions.length}</strong> colóquios recentes</span>
            <span><strong>${resources.length}</strong> recursos da Oficina</span>
          </div>
        </div>
        <div class="community-membership">
          ${community.joined
            ? html`<span class="community-status">Participando</span>
                ${community.memberRole && community.memberRole !== 'member'
                  ? html`<small>Função: ${E(community.memberRole)}</small>`
                  : ''}
                <button
                  class="outline"
                  type="button"
                  data-community-leave="${E(community.slug)}"
                  ${data.storageReady === false ? 'disabled' : ''}
                >
                  Sair da comunidade
                </button>`
            : html`<button
                class="solid"
                type="button"
                data-community-join="${E(community.slug)}"
                ${data.storageReady === false ? 'disabled' : ''}
              >
                ${state.me ? 'Participar' : 'Entrar para participar'}
              </button>`}
        </div>
      </header>

      ${data.storageReady === false
        ? html`<div class="notice community-preview-notice">
            Esta é a prévia estrutural da comunidade. A participação e o Colóquio interno serão
            persistidos quando a migração de Comunidades for ativada neste ambiente.
          </div>`
        : ''}

      <nav class="community-tabs" aria-label="Áreas da comunidade">
        <a href="${canonical}" data-link class="${focus ? '' : 'active'}">Visão geral</a>
        <a href="${canonical}/coloquio" data-link class="${focus === 'coloquio' ? 'active' : ''}">Colóquio</a>
        <a href="${canonical}#oficina" class="">Oficina</a>
      </nav>

      <section class="community-section ${focus === 'coloquio' ? 'community-focus' : ''}" id="coloquio">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Colloquium</div>
            <h2>Conversas de ${E(community.name)}</h2>
          </div>
          <button
            class="solid"
            type="button"
            data-community-discussion="${E(community.slug)}"
            data-community-name="${E(community.name)}"
            ${data.storageReady === false ? 'disabled' : ''}
          >
            Abrir discussão
          </button>
        </div>
        <p class="community-section-copy">
          Perguntas e debates vivem aqui. Tutoriais e materiais estruturados continuam na Oficina,
          ligados à mesma comunidade.
        </p>
        <div class="community-discussion-list">
          ${discussions.length
            ? discussions.map((discussion, index) => discussionRow(discussion, index)).join('')
            : empty('Ainda não há discussões vinculadas a esta comunidade.')}
        </div>
        <div id="communityComposer"></div>
      </section>

      <section class="community-section" id="oficina">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Officina</div>
            <h2>Conhecimento prático relacionado</h2>
          </div>
          ${link('/oficina', 'Explorar toda a Oficina', 'outline')}
        </div>
        <p class="community-section-copy">
          Tutoriais, guias e soluções permanecem como conteúdo estruturado da Oficina e aparecem
          aqui por contexto, sem criar cópias.
        </p>
        ${resources.length
          ? html`<div class="community-resource-grid">${resources.map(techResourceCard).join('')}</div>`
          : empty('Ainda não há recursos da Oficina associados a esta comunidade.')}
      </section>
    </div>
  </section>`);
}

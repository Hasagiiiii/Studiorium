import { api, state, E, html as markup } from '../runtime.js';
import { link, layout, empty } from './core.js';
import { buildFeed, feedPost, normalizeFeedMode } from './home-social-feed.js';
import {
  renderBooks,
  renderCommunities,
  renderCommunityPulse,
  renderComposer,
  renderCreationHub,
  renderExperts,
  renderProjects,
  renderTopics,
  socialData,
} from './home-social-widgets.js';

function hero() {
  const settings = state.boot.settings || {};
  const title = settings.hero_title || 'Conhecimento conecta.';
  const text =
    settings.hero_text ||
    'Uma rede para discutir ideias, criar projetos, publicar conhecimento e aprender em comunidade.';

  return markup`<section class="social-hero">
    <div class="shell social-hero-grid">
      <div class="social-hero-brand">
        <img src="/favicon.svg" alt="" class="social-brand-mark" />
        <div>
          <div class="eyebrow">Lorion · rede social de conhecimento</div>
          <h1>${E(title)}</h1>
          <p>${E(text)}</p>
        </div>
      </div>
      <form class="searchbar social-search" data-global-search>
        <span>⌕</span>
        <input
          name="q"
          aria-label="Pesquisar"
          placeholder="Pesquisar discussões, pessoas, projetos e temas…"
        />
        <button class="solid">Pesquisar</button>
      </form>
    </div>
  </section>`;
}

function leftSidebar(data) {
  return markup`<aside class="social-left">
    <div class="social-panel social-menu">
      <h3>Explorar</h3>
      ${link('/comunidades', '♧ Comunidades')}
      ${link('/comunidades/design-templates', '✦ Criação')}
      ${link('/biblioteca', '▤ Biblioteca')}
      ${link('/comunidades', '◌ Discussões')}
      ${link('/autores', '◎ Pessoas')}
      ${link('/noticias', '✦ Notícias')}
    </div>

    <div class="social-panel">
      <div class="social-panel-head">
        <h3>Comunidades</h3>
        ${link('/comunidades', 'Ver todas')}
      </div>
      ${renderCommunities(data.communities)}
    </div>

    <div class="social-panel">
      <div class="social-panel-head">
        <h3>Assuntos em alta</h3>
        ${link('/biblioteca', 'Pesquisar')}
      </div>
      <div class="social-topic-cloud">${renderTopics(data.topics)}</div>
    </div>
  </aside>`;
}

function discoveryStrip() {
  return markup`<div class="social-discovery-strip">
    ${link('/comunidades', '<strong>Discussões</strong>Entre na conversa')}
    ${link('/comunidades/design-templates', '<strong>Criação</strong>Templates, materiais e ideias')}
    ${link('/biblioteca', '<strong>Biblioteca</strong>Livros e pesquisas')}
  </div>`;
}

function feedTabs(mode) {
  const tab = (value, label) => {
    const href = value === 'for-you' ? '/' : `/?feed=${value}`;
    const active = mode === value ? ' active' : '';
    return link(href, label, `social-feed-tab${active}`);
  };

  return markup`<nav class="social-feed-tabs" aria-label="Filtros do feed">
    ${tab('for-you', 'Para você')}
    ${state.me ? tab('following', 'Seguindo') : ''}
    ${tab('discussions', 'Conversas')}
    ${tab('trending', 'Em alta')}
    ${tab('recent', 'Recentes')}
  </nav>`;
}

async function loadFollowingSource(mode) {
  if (mode !== 'following' || !state.me) return { entries: [], failed: false };
  try {
    const data = await api('/api/social/feed');
    return { entries: Array.isArray(data.feed) ? data.feed : [], failed: false };
  } catch {
    return { entries: [], failed: true };
  }
}

function followingEmptyState(failed = false) {
  if (failed) {
    return markup`<div class="empty">
      <p>Não foi possível carregar sua timeline agora.</p>
      <div class="actions">${link('/?feed=following', 'Tentar novamente', 'outline')}</div>
    </div>`;
  }

  const action = state.me
    ? link('/autores', 'Encontrar pessoas', 'outline')
    : link('/login', 'Entrar para seguir pessoas', 'outline');
  const message = state.me
    ? 'Siga pessoas para montar uma timeline com as publicações delas.'
    : 'Entre na sua conta para criar uma timeline de pessoas que você segue.';

  return markup`<div class="empty">
    <p>${message}</p>
    <div class="actions">${action}</div>
  </div>`;
}

function feedColumn(feed, mode, followingFailed = false) {
  const posts = feed.length
    ? feed.map(feedPost).join('')
    : mode === 'following'
      ? followingEmptyState(followingFailed)
      : empty('A timeline ainda não tem publicações para este filtro.');

  return markup`<main class="social-feed">
    ${discoveryStrip()} ${feedTabs(mode)} ${renderComposer()} ${renderCreationHub()}
    <div class="social-feed-list" aria-live="polite">${posts}</div>
  </main>`;
}

function rightSidebar(data) {
  return markup`<aside class="social-right">
    <div class="social-panel social-pulse-panel">
      <div class="social-panel-head">
        <h3>Pulso da comunidade</h3>
        ${link('/comunidades', 'Explorar')}
      </div>
      ${renderCommunityPulse(data.pulse)}
    </div>

    <div class="social-panel">
      <div class="social-panel-head">
        <h3>Projetos em alta</h3>
      </div>
      ${renderProjects(data.projects)}
    </div>

    <div class="social-panel">
      <div class="social-panel-head">
        <h3>Leituras da comunidade</h3>
        ${link('/biblioteca', 'Biblioteca')}
      </div>
      ${renderBooks(data.books)}
    </div>

    <div class="social-panel">
      <div class="social-panel-head">
        <h3>Especialistas verificados</h3>
        ${link('/autores', 'Pessoas')}
      </div>
      ${renderExperts(data.experts)}
    </div>

    <div class="social-panel social-quote">
      <span>“</span>
      <p>Grandes ideias começam com boas discussões.</p>
      <small>Lorion · Orium Labs</small>
    </div>
  </aside>`;
}

async function home() {
  const data = socialData();
  const mode = normalizeFeedMode(state.query?.get('feed') || 'for-you');
  const followingSource = await loadFollowingSource(mode);
  const feed = buildFeed(mode, followingSource.entries);
  const content = markup`${hero()}
    <section class="social-shell shell">
      ${leftSidebar(data)} ${feedColumn(feed, mode, followingSource.failed)} ${rightSidebar(data)}
    </section>`;

  layout(content);
}

export { home };

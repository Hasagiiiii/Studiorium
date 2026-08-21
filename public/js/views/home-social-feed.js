import { state, E, date, num, html as markup } from '../runtime.js';
import { link } from './core.js';

function profileFor(id, fallback = '') {
  return (state.boot.profiles || []).find(
    (profile) => profile.userId === id || profile.displayName === fallback,
  );
}

function isVerified(profile) {
  return (
    profile?.verificationStatus === 'verified' ||
    profile?.verificationStatus === 'approved'
  );
}

function authorLine(item) {
  const ownerId = item.ownerId || item.authorId || item.contributorId;
  const profile = profileFor(ownerId, item.authorName);
  const name = profile?.displayName || item.authorName || 'Comunidade Studiorium';
  const itemDate = item.createdAt || item.publishedAt || item.updatedAt;
  const badge = isVerified(profile)
    ? '<small class="social-verified">✓ Verificado</small>'
    : '';

  return markup`<div class="social-author">
    <span class="social-avatar">${E((name || 'S').slice(0, 1).toUpperCase())}</span>
    <span>
      <strong>${E(name)}</strong>
      ${badge}
      <small>${date(itemDate)}</small>
    </span>
  </div>`;
}

function publicationPost(publication) {
  const keywords = (publication.keywords || [])
    .slice(0, 4)
    .map((tag) => markup`<span>${E(tag)}</span>`)
    .join('');
  const abstract = publication.abstract || '';
  const summary = `${abstract.slice(0, 330)}${abstract.length > 330 ? '…' : ''}`;
  const detailPath = `/pesquisas/${encodeURIComponent(publication.slug)}`;
  const cover = publication.coverName
    ? markup`<a href="${detailPath}" data-link class="social-media">
        <img
          src="/api/publications/${encodeURIComponent(publication.id)}/cover"
          alt="Capa de ${E(publication.title)}"
          loading="lazy"
        />
      </a>`
    : '';

  return markup`<article class="social-post publication-card">
    ${authorLine(publication)}
    <div class="social-kicker">Pesquisa · ${E(publication.area || 'Geral')}</div>
    <h2>${link(detailPath, E(publication.title))}</h2>
    <p>${E(summary)}</p>
    ${cover}
    <div class="social-tags">${keywords}</div>
    <div class="social-actions">
      <button
        class="social-action"
        type="button"
        data-publication-boost="${E(publication.id)}"
      >
        ✦ <strong data-boost-count="${E(publication.id)}">${num(publication.boosts)}</strong>
        impulsos
      </button>
      ${link(detailPath, '◌ Abrir pesquisa', 'social-action')}
      <span class="social-stat">${num(publication.views)} leituras</span>
    </div>
  </article>`;
}

function discussionPost(discussion) {
  const body = discussion.body || '';
  const summary = `${body.slice(0, 360)}${body.length > 360 ? '…' : ''}`;
  const detailPath = `/coloquio/${encodeURIComponent(discussion.id)}`;

  return markup`<article class="social-post discussion-card">
    ${authorLine(discussion)}
    <div class="social-kicker">Discussão · ${E(discussion.category || 'Geral')}</div>
    <h2>${link(detailPath, E(discussion.title))}</h2>
    <p>${E(summary)}</p>
    <div class="social-actions">
      ${link(detailPath, '💬 Entrar na discussão', 'social-action')}
      ${link('/comunidades', '♧ Ver comunidades', 'social-action')}
    </div>
  </article>`;
}

function techPost(resource) {
  const tags = (resource.tags || [])
    .slice(0, 4)
    .map((tag) => markup`<span>${E(tag)}</span>`)
    .join('');
  const detailPath = `/oficina/${encodeURIComponent(resource.slug)}`;

  return markup`<article class="social-post project-card">
    ${authorLine(resource)}
    <div class="social-kicker">
      ${E(resource.hub || 'Tecnologia')} · ${E(resource.category || 'Tutorial')}
    </div>
    <h2>${link(detailPath, E(resource.title))}</h2>
    <p>${E((resource.summary || '').slice(0, 340))}</p>
    <div class="social-tags">${tags}</div>
    <div class="social-actions">
      ${link(detailPath, '⚙ Abrir tutorial', 'social-action')}
    </div>
  </article>`;
}

function newsPost(news) {
  const detailPath = `/noticias/${encodeURIComponent(news.slug)}`;

  return markup`<article class="social-post">
    ${authorLine(news)}
    <div class="social-kicker">Notícia certificada · ${E(news.category || 'Atualizações')}</div>
    <h2>${link(detailPath, E(news.title))}</h2>
    <p>${E((news.summary || '').slice(0, 340))}</p>
    <div class="social-actions">
      ${link(detailPath, '✦ Ler matéria', 'social-action')}
      <span class="social-stat">✓ Fontes e revisão editorial</span>
    </div>
  </article>`;
}

function buildFeed() {
  const feed = [
    ...(state.boot.publications || []).slice(0, 8).map((item) => ({
      type: 'publication',
      item,
      at: item.createdAt || item.publishedAt,
    })),
    ...(state.boot.discussions || []).slice(0, 8).map((item) => ({
      type: 'discussion',
      item,
      at: item.createdAt,
    })),
    ...(state.boot.techResources || []).slice(0, 6).map((item) => ({
      type: 'tech',
      item,
      at: item.createdAt || item.updatedAt,
    })),
    ...(state.boot.news || []).slice(0, 5).map((item) => ({
      type: 'news',
      item,
      at: item.publishedAt || item.createdAt,
    })),
  ];

  feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  return feed.slice(0, 14);
}

function feedPost(entry) {
  if (entry.type === 'publication') return publicationPost(entry.item);
  if (entry.type === 'discussion') return discussionPost(entry.item);
  if (entry.type === 'tech') return techPost(entry.item);
  return newsPost(entry.item);
}

export { buildFeed, feedPost };

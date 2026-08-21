import { state, E, date, num } from '../runtime.js';
import { link } from './core.js';

function profileFor(id, fallback = '') {
  return (state.boot.profiles || []).find(
    (profile) => profile.userId === id || profile.displayName === fallback,
  );
}

function isVerified(profile) {
  const status = profile?.verificationStatus;
  return status === 'verified' || status === 'approved';
}

function authorLine(item) {
  const ownerId = item.ownerId || item.authorId || item.contributorId;
  const profile = profileFor(ownerId, item.authorName);
  const name = profile?.displayName || item.authorName || 'Comunidade Studiorium';
  const initial = E((name || 'S').slice(0, 1).toUpperCase());
  const itemDate = date(item.createdAt || item.publishedAt || item.updatedAt);
  const badge = isVerified(profile) ? '<small class="social-verified">✓ Verificado</small>' : '';

  return [
    '<div class="social-author">',
    `<span class="social-avatar">${initial}</span>`,
    '<span>',
    `<strong>${E(name)}</strong>`,
    badge,
    `<small>${itemDate}</small>`,
    '</span>',
    '</div>',
  ].join('');
}

function tagList(tags) {
  return (tags || [])
    .slice(0, 4)
    .map((tag) => `<span>${E(tag)}</span>`)
    .join('');
}

function publicationCover(publication, detailPath) {
  if (!publication.coverName) return '';
  const id = encodeURIComponent(publication.id);
  const title = E(publication.title);

  return [
    `<a href="${detailPath}" data-link class="social-media">`,
    `<img src="/api/publications/${id}/cover"`,
    ` alt="Capa de ${title}" loading="lazy" />`,
    '</a>',
  ].join('');
}

function publicationPost(publication) {
  const abstract = publication.abstract || '';
  const suffix = abstract.length > 330 ? '…' : '';
  const summary = E(`${abstract.slice(0, 330)}${suffix}`);
  const detailPath = `/pesquisas/${encodeURIComponent(publication.slug)}`;
  const area = E(publication.area || 'Geral');
  const title = E(publication.title);
  const id = E(publication.id);
  const boosts = num(publication.boosts);
  const views = num(publication.views);

  return [
    '<article class="social-post publication-card">',
    authorLine(publication),
    `<div class="social-kicker">Pesquisa · ${area}</div>`,
    `<h2>${link(detailPath, title)}</h2>`,
    `<p>${summary}</p>`,
    publicationCover(publication, detailPath),
    `<div class="social-tags">${tagList(publication.keywords)}</div>`,
    '<div class="social-actions">',
    '<button class="social-action" type="button"',
    ` data-publication-boost="${id}">`,
    `✦ <strong data-boost-count="${id}">${boosts}</strong> impulsos`,
    '</button>',
    link(detailPath, '◌ Abrir pesquisa', 'social-action'),
    `<span class="social-stat">${views} leituras</span>`,
    '</div>',
    '</article>',
  ].join('');
}

function discussionPost(discussion) {
  const body = discussion.body || '';
  const suffix = body.length > 360 ? '…' : '';
  const summary = E(`${body.slice(0, 360)}${suffix}`);
  const detailPath = `/coloquio/${encodeURIComponent(discussion.id)}`;
  const category = E(discussion.category || 'Geral');
  const title = E(discussion.title);

  return [
    '<article class="social-post discussion-card">',
    authorLine(discussion),
    `<div class="social-kicker">Discussão · ${category}</div>`,
    `<h2>${link(detailPath, title)}</h2>`,
    `<p>${summary}</p>`,
    '<div class="social-actions">',
    link(detailPath, '💬 Entrar na discussão', 'social-action'),
    link('/comunidades', '♧ Ver comunidades', 'social-action'),
    '</div>',
    '</article>',
  ].join('');
}

function techPost(resource) {
  const detailPath = `/oficina/${encodeURIComponent(resource.slug)}`;
  const hub = E(resource.hub || 'Tecnologia');
  const category = E(resource.category || 'Tutorial');
  const title = E(resource.title);
  const summary = E((resource.summary || '').slice(0, 340));

  return [
    '<article class="social-post project-card">',
    authorLine(resource),
    `<div class="social-kicker">${hub} · ${category}</div>`,
    `<h2>${link(detailPath, title)}</h2>`,
    `<p>${summary}</p>`,
    `<div class="social-tags">${tagList(resource.tags)}</div>`,
    '<div class="social-actions">',
    link(detailPath, '⚙ Abrir tutorial', 'social-action'),
    '</div>',
    '</article>',
  ].join('');
}

function newsPost(news) {
  const detailPath = `/noticias/${encodeURIComponent(news.slug)}`;
  const category = E(news.category || 'Atualizações');
  const title = E(news.title);
  const summary = E((news.summary || '').slice(0, 340));

  return [
    '<article class="social-post">',
    authorLine(news),
    `<div class="social-kicker">Notícia certificada · ${category}</div>`,
    `<h2>${link(detailPath, title)}</h2>`,
    `<p>${summary}</p>`,
    '<div class="social-actions">',
    link(detailPath, '✦ Ler matéria', 'social-action'),
    '<span class="social-stat">✓ Fontes e revisão editorial</span>',
    '</div>',
    '</article>',
  ].join('');
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

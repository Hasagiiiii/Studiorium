import { state, E, date, num } from '../runtime.js';
import { link } from './core.js';

const FEED_MODES = new Set(['for-you', 'following', 'discussions', 'trending', 'recent']);
const FOLLOWING_TYPES = new Set(['publication', 'discussion', 'tech', 'news', 'project']);

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
  const owner = item.ownerId || item.authorId || item.contributorId;
  const profile = profileFor(owner, item.authorName);
  const name = profile?.displayName || item.authorName || 'Comunidade Lorion';
  const initial = E((name || 'L').slice(0, 1).toUpperCase());
  const itemDate = date(item.createdAt || item.publishedAt || item.updatedAt);
  const badge = isVerified(profile) ? '<small class="social-verified">✓ Verificado</small>' : '';
  const authorName = profile?.username
    ? link(`/autores/${encodeURIComponent(profile.username)}`, E(name), 'social-author-link')
    : `<strong>${E(name)}</strong>`;

  return [
    '<div class="social-author">',
    `<span class="social-avatar">${initial}</span>`,
    '<span>',
    authorName,
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
  const featuredLabel = news.featured ? ' · Destaque editorial' : '';

  return [
    '<article class="social-post">',
    authorLine(news),
    `<div class="social-kicker">Notícia certificada${featuredLabel} · ${category}</div>`,
    `<h2>${link(detailPath, title)}</h2>`,
    `<p>${summary}</p>`,
    '<div class="social-actions">',
    link(detailPath, '✦ Ler matéria', 'social-action'),
    '<span class="social-stat">✓ Fontes e revisão editorial</span>',
    '</div>',
    '</article>',
  ].join('');
}

function projectPost(project) {
  const detailPath = `/projetos/${encodeURIComponent(project.id)}`;
  const excerpt = (project.sections || []).find((section) => section.content)?.content || '';
  const summary = E(excerpt.slice(0, 340) || 'Projeto compartilhado com a comunidade.');

  return [
    '<article class="social-post project-card">',
    authorLine(project),
    `<div class="social-kicker">Projeto · ${E(project.type || 'Criação')}</div>`,
    `<h2>${link(detailPath, E(project.title))}</h2>`,
    `<p>${summary}</p>`,
    '<div class="social-actions">',
    link(detailPath, '⌘ Abrir projeto', 'social-action'),
    '</div>',
    '</article>',
  ].join('');
}

function normalizeFeedMode(mode) {
  return FEED_MODES.has(mode) ? mode : 'for-you';
}

function timestamp(entry) {
  const value = new Date(entry.at || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ownerId(entry) {
  return entry.item.ownerId || entry.item.authorId || entry.item.contributorId || null;
}

function normalizeFollowingFeed(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(
    (entry) =>
      entry &&
      FOLLOWING_TYPES.has(entry.type) &&
      entry.item &&
      typeof entry.item === 'object' &&
      typeof entry.item.id === 'string',
  );
}

function freshnessScore(entry) {
  const ageHours = Math.max(0, (Date.now() - timestamp(entry)) / 36e5);
  return 120 / (1 + ageHours / 24);
}

function activityScore(entry) {
  if (entry.type === 'publication') {
    const boosts = numeric(entry.item.boosts);
    const views = numeric(entry.item.views);
    return boosts * 8 + Math.log10(views + 1) * 16;
  }
  if (entry.type === 'discussion') {
    return 18;
  }
  if (entry.type === 'news') {
    const hypes = numeric(entry.item.hypes);
    const featured = entry.item.featured === true ? 48 : 0;
    return 14 + featured + Math.log10(hypes + 1) * 8;
  }
  return 10;
}

function blendedScore(entry) {
  const verified = isVerified(profileFor(ownerId(entry), entry.item.authorName)) ? 14 : 0;
  return freshnessScore(entry) + activityScore(entry) + verified;
}

function sourceFeed() {
  return [
    ...(state.boot.publications || []).slice(0, 10).map((item) => ({
      type: 'publication',
      item,
      at: item.createdAt || item.publishedAt,
    })),
    ...(state.boot.discussions || []).slice(0, 10).map((item) => ({
      type: 'discussion',
      item,
      at: item.createdAt,
    })),
    ...(state.boot.techResources || []).slice(0, 8).map((item) => ({
      type: 'tech',
      item,
      at: item.createdAt || item.updatedAt,
    })),
    ...(state.boot.news || []).slice(0, 6).map((item) => ({
      type: 'news',
      item,
      at: item.publishedAt || item.createdAt,
    })),
  ];
}

function buildFeed(mode = 'for-you', remoteFollowingFeed = []) {
  const selectedMode = normalizeFeedMode(mode);
  const feed = sourceFeed();

  if (selectedMode === 'following') {
    return normalizeFollowingFeed(remoteFollowingFeed)
      .sort((a, b) => timestamp(b) - timestamp(a))
      .slice(0, 40);
  }

  if (selectedMode === 'discussions') {
    return feed
      .filter((entry) => entry.type === 'discussion')
      .sort((a, b) => timestamp(b) - timestamp(a))
      .slice(0, 14);
  }

  if (selectedMode === 'recent') {
    return feed.sort((a, b) => timestamp(b) - timestamp(a)).slice(0, 14);
  }

  if (selectedMode === 'trending') {
    return feed
      .sort(
        (a, b) =>
          activityScore(b) +
          freshnessScore(b) * 0.35 -
          (activityScore(a) + freshnessScore(a) * 0.35),
      )
      .slice(0, 14);
  }

  return feed.sort((a, b) => blendedScore(b) - blendedScore(a)).slice(0, 14);
}

function feedPost(entry) {
  if (entry.type === 'publication') return publicationPost(entry.item);
  if (entry.type === 'discussion') return discussionPost(entry.item);
  if (entry.type === 'tech') return techPost(entry.item);
  if (entry.type === 'project') return projectPost(entry.item);
  return newsPost(entry.item);
}

export { buildFeed, feedPost, normalizeFeedMode };

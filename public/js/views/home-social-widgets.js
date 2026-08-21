import { state, E } from '../runtime.js';
import { link } from './core.js';

function isVerified(profile) {
  const status = profile?.verificationStatus;
  return status === 'verified' || status === 'approved';
}

function trendingTopics() {
  const counts = new Map();
  const add = (value) => {
    const key = String(value || '').trim();
    if (key.length < 2) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  (state.boot.publications || []).forEach((publication) => {
    add(publication.area);
    (publication.keywords || []).forEach(add);
  });
  (state.boot.discussions || []).forEach((discussion) => {
    add(discussion.category);
  });
  (state.boot.techResources || []).forEach((resource) => {
    add(resource.category);
    (resource.tags || []).forEach(add);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);
}

function communitySpotlight() {
  return (state.boot.communities || [])
    .filter((community) => community.slug && community.name)
    .slice(0, 5);
}

function renderCommunities(communities) {
  if (!communities.length) {
    return '<p class="muted small">As primeiras comunidades aparecerão aqui.</p>';
  }

  return communities
    .map((community) => {
      const href = `/comunidades/${encodeURIComponent(community.slug)}`;
      const description = E(community.description || 'Comunidade do Studiorium.');
      const initial = E(community.name.slice(0, 1));
      const name = E(community.name);

      return [
        `<a class="community-spot" href="${href}" data-link>`,
        `<span class="community-icon">${initial}</span>`,
        '<span>',
        `<strong>${name}</strong>`,
        `<small>${description}</small>`,
        '</span>',
        '<b>+</b>',
        '</a>',
      ].join('');
    })
    .join('');
}

function renderTopics(topics) {
  if (!topics.length) {
    return '<span class="muted small">Os assuntos aparecem conforme a comunidade publica.</span>';
  }

  return topics
    .map((topic) => {
      const href = `/biblioteca?q=${encodeURIComponent(topic)}`;
      return `<a href="${href}" data-link>#${E(topic)}</a>`;
    })
    .join('');
}

function projectHref(project) {
  if (!project?.id) return '/projetos';
  return `/projetos/${encodeURIComponent(project.id)}`;
}

function renderProjects(projects) {
  if (!projects.length) {
    return '<p class="muted">Os primeiros projetos vão aparecer aqui.</p>';
  }

  return projects
    .map((project) => {
      const description = project.description || project.type || 'Projeto da comunidade';
      const href = projectHref(project);
      const title = E(project.title);
      const summary = E(description.slice(0, 70));

      return [
        `<a class="social-list-item" href="${href}" data-link>`,
        '<span class="project-mini">⌘</span>',
        '<span>',
        `<strong>${title}</strong>`,
        `<small>${summary}</small>`,
        '</span>',
        '</a>',
      ].join('');
    })
    .join('');
}

function renderBooks(books) {
  if (!books.length) {
    return '<p class="muted">As recomendações de livros aparecerão aqui.</p>';
  }

  return books
    .map((book) => {
      const href = `/livros/${encodeURIComponent(book.id)}`;
      const description = book.author || book.category || 'Livro recomendado';
      const title = E(book.title);

      return [
        `<a class="social-list-item" href="${href}" data-link>`,
        '<span class="project-mini">▤</span>',
        '<span>',
        `<strong>${title}</strong>`,
        `<small>${E(description)}</small>`,
        '</span>',
        '</a>',
      ].join('');
    })
    .join('');
}

function renderExperts(profiles) {
  if (!profiles.length) {
    return '<p class="muted">Perfis públicos aparecerão aqui.</p>';
  }

  return profiles
    .filter((profile) => profile.username)
    .map((profile) => {
      const name = profile.displayName || profile.username;
      const specialty = profile.verifiedSpecialty || profile.profileType || 'Membro';
      const badge = isVerified(profile) ? '✓ ' : '';
      const href = `/autores/${encodeURIComponent(profile.username)}`;
      const initial = E((name || 'S').slice(0, 1));

      return [
        `<a class="social-list-item" href="${href}" data-link>`,
        `<span class="social-avatar">${initial}</span>`,
        '<span>',
        `<strong>${E(name)}</strong>`,
        `<small>${badge}${E(specialty)}</small>`,
        '</span>',
        '</a>',
      ].join('');
    })
    .join('');
}

function guestComposer() {
  return [
    '<div class="social-composer guest">',
    '<div>',
    '<strong>Entre para fazer parte da conversa.</strong>',
    '<p>Siga comunidades, publique conhecimento e participe das discussões.</p>',
    '</div>',
    '<div class="actions">',
    link('/cadastro', 'Criar conta', 'solid'),
    link('/login', 'Entrar', 'outline'),
    '</div>',
    '</div>',
  ].join('');
}

function memberComposer() {
  const initial = E((state.me.displayName || 'S').slice(0, 1));

  return [
    '<div class="social-composer">',
    `<span class="social-avatar">${initial}</span>`,
    '<div>',
    '<strong>Compartilhe algo com a comunidade</strong>',
    '<p>Publique uma pesquisa, abra uma discussão ou mostre um projeto.</p>',
    '</div>',
    '<div class="actions">',
    link('/publicar', 'Publicar', 'solid'),
    link('/comunidades', 'Discutir', 'soft'),
    '</div>',
    '</div>',
  ].join('');
}

function renderComposer() {
  return state.me ? memberComposer() : guestComposer();
}

function socialData() {
  const projects = [
    ...(state.boot.codeProjects || []),
    ...(state.boot.communityProjects || []),
  ].slice(0, 5);
  const profiles = (state.boot.profiles || []).slice(0, 5);
  const verified = (state.boot.profiles || []).filter(isVerified).slice(0, 4);

  return {
    projects,
    books: (state.boot.books || []).slice(0, 4),
    communities: communitySpotlight(),
    topics: trendingTopics(),
    experts: verified.length ? verified : profiles,
  };
}

export {
  renderCommunities,
  renderTopics,
  renderProjects,
  renderBooks,
  renderExperts,
  renderComposer,
  socialData,
};

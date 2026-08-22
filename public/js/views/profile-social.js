import { E, date, html, initials, num, state } from '../runtime.js';
import { empty, layout, link, publicationCard } from './core.js';

const PROFILE_TYPE_LABELS = {
  estudante: 'Estudante',
  universitario: 'Universitário',
  professor: 'Professor',
  pesquisador: 'Pesquisador',
  designer: 'Designer',
  instituicao: 'Instituição',
  criador: 'Criador',
  jornalista: 'Jornalista',
  comunicador: 'Comunicador',
  monitor: 'Monitor',
  tecnico: 'Técnico',
  profissional: 'Profissional',
  autodidata: 'Autodidata',
  internauta: 'Internauta',
};

function typeLabel(type) {
  return PROFILE_TYPE_LABELS[type] || type || 'Membro';
}

function mediaUrl(profile, kind) {
  return `/api/profiles/${encodeURIComponent(profile.username)}/media/${kind}`;
}

function publicProfileFor(username) {
  const publicProfile = (state.boot?.profiles || []).find(
    (profile) => profile.username === username,
  );
  if (publicProfile) return publicProfile;
  if (state.me?.username === username) {
    return { ...state.me, userId: state.me.id };
  }
  return null;
}

function profileStats(profile) {
  const publications = (state.boot?.publications || []).filter(
    (item) => item.ownerId === profile.userId || item.authorName === profile.displayName,
  );
  const projects = (state.boot?.communityProjects || []).filter(
    (item) => item.ownerId === profile.userId,
  );
  const discussions = (state.boot?.discussions || []).filter(
    (item) => item.authorId === profile.userId || item.authorName === profile.displayName,
  );
  return {
    publications,
    projects,
    discussions,
    views: publications.reduce((sum, item) => sum + Number(item.views || 0), 0),
  };
}

function avatar(profile, className = '') {
  if (profile.hasAvatar) {
    return html`<span class="profile-photo ${E(className)}"><img src="${mediaUrl(
      profile,
      'avatar',
    )}" alt="Foto de ${E(profile.displayName)}" /></span>`;
  }
  return html`<span class="profile-photo ${E(className)}">${E(initials(profile.displayName))}</span>`;
}

function authorCard(profile) {
  const stats = profileStats(profile);
  return html`<a
    href="/autores/${encodeURIComponent(profile.username)}"
    data-link
    class="profile-discovery-card hover"
  >
    <span class="profile-card-cover">
      ${profile.hasCover
        ? html`<img src="${mediaUrl(profile, 'cover')}" alt="" loading="lazy" />`
        : '<span class="profile-cover-fallback">Studiorium</span>'}
    </span>
    <span class="profile-card-main">
      ${avatar(profile, 'profile-card-avatar')}
      <span class="profile-card-copy">
        <span class="profile-card-title">
          <strong>${E(profile.displayName)}</strong>
          ${profile.verificationStatus === 'verified'
            ? '<span class="profile-verified-dot" title="Especialista verificado">✓</span>'
            : ''}
        </span>
        <small>@${E(profile.username)} · ${E(typeLabel(profile.profileType))}</small>
      </span>
    </span>
    <span class="profile-card-bio">${E(profile.bio || 'Membro da comunidade Studiorium.')}</span>
    <span class="profile-card-stats">
      <span><strong>${stats.publications.length}</strong><small>publicações</small></span>
      <span><strong>${stats.projects.length}</strong><small>projetos</small></span>
      <span><strong>${stats.discussions.length}</strong><small>discussões</small></span>
    </span>
  </a>`;
}

function autores() {
  const query = (state.query.get('q') || '').trim().toLocaleLowerCase('pt-BR');
  const type = state.query.get('tipo') || '';
  const publicProfiles = state.boot?.profiles || [];
  const types = [...new Set(publicProfiles.map((profile) => profile.profileType))].sort((a, b) =>
    typeLabel(a).localeCompare(typeLabel(b), 'pt-BR'),
  );
  const profiles = publicProfiles.filter(
    (profile) =>
      (!query || JSON.stringify(profile).toLocaleLowerCase('pt-BR').includes(query)) &&
      (!type || profile.profileType === type),
  );

  layout(
    html`<section class="pagehero profile-directory-hero">
      <div class="shell">
        <div class="profile-directory-heading">
          <div>
            <div class="eyebrow">Communitas</div>
            <h1 class="pagetitle">Pessoas do Studiorium</h1>
            <p>Encontre autores, estudantes, professores, especialistas e criadores.</p>
          </div>
          ${state.me?.username
            ? link(`/autores/${encodeURIComponent(state.me.username)}`, 'Meu perfil', 'outline')
            : ''}
        </div>
        <form class="toolbar author-search profile-directory-search" data-author-filter>
          <input
            class="field"
            type="search"
            name="q"
            value="${E(state.query.get('q') || '')}"
            placeholder="Pesquisar nome, curso ou instituição"
          />
          <select class="select" name="tipo">
            <option value="">Todos os perfis</option>
            ${types
              .map(
                (item) =>
                  html`<option value="${E(item)}" ${item === type ? 'selected' : ''}>
                    ${E(typeLabel(item))}
                  </option>`,
              )
              .join('')}
          </select>
          <button class="solid">Pesquisar</button>
        </form>
        <div class="profile-directory-grid">
          ${profiles.map(authorCard).join('') || empty('Nenhum perfil público encontrado.')}
        </div>
      </div>
    </section>`,
  );
}

function projectCard(project) {
  const excerpt = (project.sections || []).find((section) => section.content)?.content || '';
  return html`<article class="card hover profile-project-card">
    <div class="eyebrow">${E(project.type || 'Projeto')}</div>
    <h3>${link(`/projetos/${encodeURIComponent(project.id)}`, E(project.title))}</h3>
    <p>${E(excerpt.slice(0, 180) || 'Projeto compartilhado com a comunidade.')}</p>
    <div class="meta"><span>Atualizado ${date(project.updatedAt)}</span></div>
  </article>`;
}

function discussionCard(discussion) {
  return html`<article class="card hover profile-discussion-card">
    <div class="eyebrow">${E(discussion.category || 'Colloquium')}</div>
    <h3>${link(`/coloquio/${encodeURIComponent(discussion.id)}`, E(discussion.title))}</h3>
    <p>${E(String(discussion.body || '').slice(0, 180))}</p>
    <div class="meta"><span>${date(discussion.createdAt)}</span></div>
  </article>`;
}

function contentPanel(label, count, content, emptyText) {
  return html`<details class="profile-content-panel">
    <summary>
      <span>${E(label)}</span><strong>${num(count)}</strong>
    </summary>
    <div class="profile-content-panel-body">
      <div class="grid grid2">${content || empty(emptyText)}</div>
    </div>
  </details>`;
}

function authorDetail(username) {
  const profile = publicProfileFor(username);
  if (!profile) {
    layout(
      html`<div class="errorpage">
        <div class="eyebrow">Perfil indisponível</div>
        <h1>Este perfil não está público.</h1>
        <p>O perfil pode ser privado ou não existir mais.</p>
        ${link('/autores', 'Voltar para pessoas', 'solid')}
      </div>`,
    );
    return;
  }

  const stats = profileStats(profile);
  const isOwn = state.me?.id === profile.userId;

  layout(
    html`<section class="profile-social-page profile-social-minimal">
      <div class="shell">
        <article class="profile-social-hero">
          <div class="profile-social-cover">
            ${profile.hasCover
              ? html`<img src="${mediaUrl(profile, 'cover')}" alt="Capa de ${E(
                  profile.displayName,
                )}" />`
              : '<span class="profile-cover-fallback large">Studiorium</span>'}
          </div>
          <div class="profile-social-header compact">
            ${avatar(profile, 'profile-social-avatar')}
            <div class="profile-social-identity">
              <div class="profile-social-name-row">
                <h1>${E(profile.displayName)}</h1>
                ${profile.verificationStatus === 'verified'
                  ? '<span class="profile-verified-dot large" title="Especialista verificado">✓</span>'
                  : ''}
              </div>
              <div class="profile-social-handle">
                @${E(profile.username)} · ${E(typeLabel(profile.profileType))}
              </div>
              <p class="profile-social-bio">${E(
                profile.bio || 'Este membro ainda não adicionou uma biografia.',
              )}</p>
              <div class="profile-social-meta">
                ${profile.course ? `<span>${E(profile.course)}</span>` : ''}
                ${profile.institution ? `<span>${E(profile.institution)}</span>` : ''}
                ${profile.educationLevel ? `<span>${E(profile.educationLevel)}</span>` : ''}
              </div>
            </div>
            <div class="profile-social-actions">
              ${isOwn ? link('/escrivaninha', 'Gerenciar na Escrivaninha', 'solid') : ''}
            </div>
          </div>
          <div class="profile-social-stats compact">
            <span><strong>${stats.publications.length}</strong><small>Publicações</small></span>
            <span><strong>${stats.projects.length}</strong><small>Projetos</small></span>
            <span><strong>${stats.discussions.length}</strong><small>Discussões</small></span>
            <span><strong>${num(stats.views)}</strong><small>Leituras</small></span>
          </div>
          ${isOwn && profile.isPublic === false
            ? '<div class="profile-private-notice">Perfil privado — somente você consegue ver esta página.</div>'
            : ''}
        </article>

        <div class="profile-content-switcher">
          ${contentPanel(
            'Publicações',
            stats.publications.length,
            stats.publications.map(publicationCard).join(''),
            'Nenhuma publicação pública ainda.',
          )}
          ${contentPanel(
            'Projetos',
            stats.projects.length,
            stats.projects.map(projectCard).join(''),
            'Nenhum projeto público ainda.',
          )}
          ${contentPanel(
            'Discussões',
            stats.discussions.length,
            stats.discussions.map(discussionCard).join(''),
            'Nenhuma discussão pública ainda.',
          )}
        </div>
      </div>
    </section>`,
  );
}

export { autores, authorDetail };

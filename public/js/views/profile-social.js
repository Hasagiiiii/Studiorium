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

function profileTone(username = '') {
  const total = [...String(username)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `tone-${(total % 4) + 1}`;
}

function publicProfileFor(username) {
  const publicProfile = (state.boot?.profiles || []).find((profile) => profile.username === username);
  if (publicProfile) return publicProfile;

  if (state.me?.username === username) {
    return {
      ...state.me,
      userId: state.me.id,
      createdAt: state.me.createdAt,
    };
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
  const views = publications.reduce((sum, item) => sum + Number(item.views || 0), 0);

  return {
    publications,
    projects,
    discussions,
    views,
    contributions: publications.length + projects.length + discussions.length,
  };
}

function authorCard(profile) {
  const stats = profileStats(profile);
  const specialty = profile.verifiedSpecialty || profile.course || typeLabel(profile.profileType);

  return html`<a
    href="/autores/${encodeURIComponent(profile.username)}"
    data-link
    class="profile-discovery-card hover"
  >
    <span class="profile-card-cover ${profileTone(profile.username)}" aria-hidden="true"></span>
    <span class="profile-card-main">
      <span class="profile-card-avatar">${E(initials(profile.displayName))}</span>
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
    <span class="profile-card-specialty">${E(specialty)}</span>
    <span class="profile-card-bio">${E(
      profile.bio || 'Membro da comunidade Studiorium.',
    )}</span>
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

  layout(html`<section class="pagehero profile-directory-hero">
    <div class="shell">
      <div class="profile-directory-heading">
        <div>
          <div class="eyebrow">Communitas</div>
          <h1 class="pagetitle">Pessoas do Studiorium</h1>
          <p>
            Conheça estudantes, especialistas, professores e criadores pelo que constroem e
            compartilham na comunidade.
          </p>
        </div>
        ${state.me?.username
          ? link(`/autores/${encodeURIComponent(state.me.username)}`, 'Meu perfil', 'solid')
          : link('/cadastro', 'Criar meu perfil', 'solid')}
      </div>
      <form class="toolbar author-search profile-directory-search" data-author-filter>
        <input
          class="field"
          type="search"
          name="q"
          value="${E(state.query.get('q') || '')}"
          placeholder="Pesquisar nome, curso, instituição ou especialidade"
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
  </section>`);
}

function activityItem(item) {
  if (item.kind === 'publication') {
    return html`<a href="/pesquisas/${encodeURIComponent(item.slug)}" data-link class="profile-activity-item">
      <span class="profile-activity-icon">§</span>
      <span><small>Publicação</small><strong>${E(item.title)}</strong><em>${date(item.when)}</em></span>
    </a>`;
  }
  if (item.kind === 'project') {
    return html`<a href="/projetos/${encodeURIComponent(item.id)}" data-link class="profile-activity-item">
      <span class="profile-activity-icon">⌘</span>
      <span><small>Projeto</small><strong>${E(item.title)}</strong><em>${date(item.when)}</em></span>
    </a>`;
  }
  return html`<a href="/coloquio/${encodeURIComponent(item.id)}" data-link class="profile-activity-item">
    <span class="profile-activity-icon">◌</span>
    <span><small>Discussão</small><strong>${E(item.title)}</strong><em>${date(item.when)}</em></span>
  </a>`;
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

function authorDetail(username) {
  const profile = publicProfileFor(username);
  if (!profile) {
    layout(html`<div class="errorpage">
      <div class="eyebrow">Perfil indisponível</div>
      <h1>Este perfil não está público.</h1>
      <p>O usuário pode ter deixado o perfil privado ou o registro não existe mais.</p>
      ${link('/autores', 'Voltar para pessoas', 'solid')}
    </div>`);
    return;
  }

  const stats = profileStats(profile);
  const isOwn = state.me?.id === profile.userId;
  const specialty = profile.verifiedSpecialty || profile.course || typeLabel(profile.profileType);
  const recentActivity = [
    ...stats.publications.map((item) => ({ ...item, kind: 'publication', when: item.createdAt })),
    ...stats.projects.map((item) => ({ ...item, kind: 'project', when: item.updatedAt })),
    ...stats.discussions.map((item) => ({ ...item, kind: 'discussion', when: item.createdAt })),
  ]
    .filter((item) => item.when)
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 5);

  layout(html`<section class="profile-social-page">
    <div class="shell">
      <article class="profile-social-hero">
        <div class="profile-social-cover ${profileTone(profile.username)}">
          <span class="profile-cover-mark">Studiorium</span>
        </div>
        <div class="profile-social-header">
          <div class="profile-social-avatar" aria-label="Avatar de ${E(profile.displayName)}">
            ${E(initials(profile.displayName))}
          </div>
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
            <div class="profile-social-badges">
              ${profile.verificationStatus === 'verified'
                ? html`<span class="verified-badge large">✓ ${E(specialty)}</span>`
                : ''}
              ${profile.contributionStatus === 'active_collaborator'
                ? '<span class="badge collaborator">Colaborador ativo</span>'
                : ''}
              ${isOwn && profile.isPublic === false
                ? '<span class="profile-private-badge">Perfil privado</span>'
                : ''}
            </div>
          </div>
          <div class="profile-social-actions">
            ${isOwn
              ? link('/escrivaninha', 'Editar perfil', 'solid')
              : '<a href="#obras" class="solid">Ver conteúdo</a>'}
            ${link('/autores', 'Pessoas', 'outline')}
          </div>
        </div>
        <div class="profile-social-body">
          <div class="profile-social-intro">
            <p class="profile-social-bio">${E(
              profile.bio || 'Este membro ainda não adicionou uma biografia.',
            )}</p>
            <div class="profile-social-meta">
              ${profile.course ? `<span>◈ ${E(profile.course)}</span>` : ''}
              ${profile.institution ? `<span>⌂ ${E(profile.institution)}</span>` : ''}
              ${profile.educationLevel ? `<span>◇ ${E(profile.educationLevel)}</span>` : ''}
              ${profile.createdAt ? `<span>Desde ${date(profile.createdAt)}</span>` : ''}
            </div>
          </div>
          <div class="profile-social-stats" aria-label="Estatísticas públicas do perfil">
            <span><strong>${stats.publications.length}</strong><small>Publicações</small></span>
            <span><strong>${stats.projects.length}</strong><small>Projetos</small></span>
            <span><strong>${stats.discussions.length}</strong><small>Discussões</small></span>
            <span><strong>${num(stats.views)}</strong><small>Leituras</small></span>
          </div>
        </div>
        ${isOwn && profile.isPublic === false
          ? html`<div class="profile-private-notice">
              Você consegue visualizar este perfil porque ele é seu. Ele continua invisível na
              busca pública enquanto a opção “Manter meu perfil público” estiver desativada.
            </div>`
          : ''}
      </article>

      <nav class="profile-social-tabs" aria-label="Seções do perfil">
        <a href="#atividade">Atividade</a>
        <a href="#obras">Publicações</a>
        <a href="#projetos">Projetos</a>
        <a href="#discussoes">Discussões</a>
        <a href="#sobre">Sobre</a>
      </nav>

      <div class="profile-social-layout">
        <div class="profile-social-main">
          <section id="atividade" class="profile-social-section">
            <div class="sectionhead">
              <div><div class="eyebrow">Recentia</div><h2>Atividade recente</h2></div>
              <span class="profile-contribution-count">${stats.contributions} contribuições públicas</span>
            </div>
            <div class="profile-activity-list">
              ${recentActivity.map(activityItem).join('') ||
              empty('Ainda não há atividade pública neste perfil.')}
            </div>
          </section>

          <section id="obras" class="profile-social-section">
            <div class="sectionhead">
              <div><div class="eyebrow">Opera</div><h2>Publicações</h2></div>
            </div>
            <div class="grid grid2">
              ${stats.publications.map(publicationCard).join('') ||
              empty('Nenhuma publicação pública ainda.')}
            </div>
          </section>

          <section id="projetos" class="profile-social-section">
            <div class="sectionhead">
              <div><div class="eyebrow">Proiecta</div><h2>Projetos</h2></div>
            </div>
            <div class="grid grid2">
              ${stats.projects.map(projectCard).join('') || empty('Nenhum projeto público ainda.')}
            </div>
          </section>

          <section id="discussoes" class="profile-social-section">
            <div class="sectionhead">
              <div><div class="eyebrow">Colloquium</div><h2>Discussões</h2></div>
            </div>
            <div class="grid grid2">
              ${stats.discussions.map(discussionCard).join('') ||
              empty('Nenhuma discussão pública ainda.')}
            </div>
          </section>
        </div>

        <aside id="sobre" class="profile-social-sidebar">
          <section class="card profile-about-card">
            <div class="eyebrow">Identitas</div>
            <h3>Sobre</h3>
            <dl>
              <div><dt>Perfil</dt><dd>${E(typeLabel(profile.profileType))}</dd></div>
              <div><dt>Área</dt><dd>${E(profile.course || 'Não informada')}</dd></div>
              <div><dt>Instituição</dt><dd>${E(profile.institution || 'Não informada')}</dd></div>
              <div><dt>Formação</dt><dd>${E(profile.educationLevel || 'Não informada')}</dd></div>
              <div><dt>Status</dt><dd>${profile.verificationStatus === 'verified' ? 'Verificado' : 'Membro'}</dd></div>
            </dl>
          </section>
          <section class="card profile-impact-card">
            <div class="eyebrow">Vestigia</div>
            <h3>Impacto público</h3>
            <strong>${num(stats.views)}</strong>
            <p>leituras acumuladas nas publicações deste perfil.</p>
          </section>
        </aside>
      </div>
    </div>
  </section>`);
}

export { autores, authorDetail };

import { state, E, date, num, html } from '../runtime.js';
import { link, layout, empty } from './core.js';

function profileFor(id, fallback = '') {
  return (state.boot.profiles || []).find(
    (profile) => profile.userId === id || profile.displayName === fallback,
  );
}

function authorLine(item) {
  const profile = profileFor(item.ownerId || item.authorId || item.contributorId, item.authorName);
  const name = profile?.displayName || item.authorName || 'Comunidade Studiorium';
  const verified =
    profile?.verificationStatus === 'verified' || profile?.verificationStatus === 'approved';
  const itemDate = item.createdAt || item.publishedAt || item.updatedAt;

  return html`<div class="social-author">
    <span class="social-avatar">${E((name || 'S').slice(0, 1).toUpperCase())}</span>
    <span>
      <strong>${E(name)}</strong>
      ${verified ? '<small class="social-verified">✓ Verificado</small>' : ''}
      <small>${date(itemDate)}</small>
    </span>
  </div>`;
}

function publicationPost(publication) {
  const keywords = (publication.keywords || [])
    .slice(0, 4)
    .map((tag) => html`<span>${E(tag)}</span>`)
    .join('');

  return html`<article class="social-post publication-card">
    ${authorLine(publication)}
    <div class="social-kicker">Pesquisa · ${E(publication.area || 'Geral')}</div>
    <h2>
      ${link('/pesquisas/' + encodeURIComponent(publication.slug), E(publication.title))}
    </h2>
    <p>
      ${E((publication.abstract || '').slice(0, 330))}${(publication.abstract || '').length > 330
        ? '…'
        : ''}
    </p>
    ${publication.coverName
      ? html`<a
          href="/pesquisas/${encodeURIComponent(publication.slug)}"
          data-link
          class="social-media"
        >
          <img
            src="/api/publications/${encodeURIComponent(publication.id)}/cover"
            alt="Capa de ${E(publication.title)}"
            loading="lazy"
          />
        </a>`
      : ''}
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
      ${link(
        '/pesquisas/' + encodeURIComponent(publication.slug),
        '◌ Abrir pesquisa',
        'social-action',
      )}
      <span class="social-stat">${num(publication.views)} leituras</span>
    </div>
  </article>`;
}

function discussionPost(discussion) {
  return html`<article class="social-post discussion-card">
    ${authorLine(discussion)}
    <div class="social-kicker">Discussão · ${E(discussion.category || 'Geral')}</div>
    <h2>${link('/coloquio/' + encodeURIComponent(discussion.id), E(discussion.title))}</h2>
    <p>
      ${E((discussion.body || '').slice(0, 360))}${(discussion.body || '').length > 360
        ? '…'
        : ''}
    </p>
    <div class="social-actions">
      ${link(
        '/coloquio/' + encodeURIComponent(discussion.id),
        '💬 Entrar na discussão',
        'social-action',
      )}
      ${link('/comunidades', '♧ Ver comunidades', 'social-action')}
    </div>
  </article>`;
}

function techPost(resource) {
  const tags = (resource.tags || [])
    .slice(0, 4)
    .map((tag) => html`<span>${E(tag)}</span>`)
    .join('');

  return html`<article class="social-post project-card">
    ${authorLine(resource)}
    <div class="social-kicker">
      ${E(resource.hub || 'Tecnologia')} · ${E(resource.category || 'Tutorial')}
    </div>
    <h2>${link('/oficina/' + encodeURIComponent(resource.slug), E(resource.title))}</h2>
    <p>${E((resource.summary || '').slice(0, 340))}</p>
    <div class="social-tags">${tags}</div>
    <div class="social-actions">
      ${link('/oficina/' + encodeURIComponent(resource.slug), '⚙ Abrir tutorial', 'social-action')}
    </div>
  </article>`;
}

function newsPost(news) {
  return html`<article class="social-post">
    ${authorLine(news)}
    <div class="social-kicker">Notícia certificada · ${E(news.category || 'Atualizações')}</div>
    <h2>${link('/noticias/' + encodeURIComponent(news.slug), E(news.title))}</h2>
    <p>${E((news.summary || '').slice(0, 340))}</p>
    <div class="social-actions">
      ${link('/noticias/' + encodeURIComponent(news.slug), '✦ Ler matéria', 'social-action')}
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

  return feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 14);
}

function feedPost(entry) {
  if (entry.type === 'publication') return publicationPost(entry.item);
  if (entry.type === 'discussion') return discussionPost(entry.item);
  if (entry.type === 'tech') return techPost(entry.item);
  return newsPost(entry.item);
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
  (state.boot.discussions || []).forEach((discussion) => add(discussion.category));
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

function projectHref(project) {
  return project?.id ? `/projetos/${encodeURIComponent(project.id)}` : '/projetos';
}

function home() {
  const settings = state.boot.settings || {};
  const feed = buildFeed();
  const projects = [
    ...(state.boot.codeProjects || []),
    ...(state.boot.communityProjects || []),
  ].slice(0, 5);
  const profiles = (state.boot.profiles || []).slice(0, 5);
  const verified = (state.boot.profiles || [])
    .filter(
      (profile) =>
        profile.verificationStatus === 'verified' || profile.verificationStatus === 'approved',
    )
    .slice(0, 4);
  const books = (state.boot.books || []).slice(0, 4);
  const topics = trendingTopics();
  const communities = communitySpotlight();

  layout(html`
    <section class="social-hero">
      <div class="shell social-hero-grid">
        <div class="social-hero-brand">
          <img src="/favicon.svg" alt="" class="social-brand-mark" />
          <div>
            <div class="eyebrow">Conhecimento · comunidade · criação</div>
            <h1>${E(settings.hero_title || 'Aprenda. Construa. Compartilhe.')}</h1>
            <p>
              ${E(
                settings.hero_text ||
                  'Uma rede para discutir ideias, criar projetos, publicar conhecimento e aprender em comunidade.',
              )}
            </p>
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
    </section>

    <section class="social-shell shell">
      <aside class="social-left">
        <div class="social-panel social-menu">
          <h3>Explorar</h3>
          ${link('/comunidades', '♧ Comunidades')}${link('/projetos', '⌘ Projetos')}${link(
            '/biblioteca',
            '▤ Biblioteca',
          )}${link('/coloquio', '◌ Discussões')}${link('/oficina', '⚙ Tecnologia')}${link(
            '/autores',
            '◎ Pessoas',
          )}${link('/noticias', '✦ Notícias')}
        </div>

        <div class="social-panel">
          <div class="social-panel-head">
            <h3>Comunidades</h3>
            ${link('/comunidades', 'Ver todas')}
          </div>
          ${communities.length
            ? communities
                .map(
                  (community) => html`<a
                    class="community-spot"
                    href="/comunidades/${encodeURIComponent(community.slug)}"
                    data-link
                  >
                    <span class="community-icon">${E(community.name.slice(0, 1))}</span>
                    <span>
                      <strong>${E(community.name)}</strong>
                      <small>${E(community.description || 'Comunidade do Studiorium.')}</small>
                    </span>
                    <b>+</b>
                  </a>`,
                )
                .join('')
            : '<p class="muted small">As primeiras comunidades aparecerão aqui.</p>'}
        </div>

        <div class="social-panel">
          <div class="social-panel-head">
            <h3>Assuntos em alta</h3>
            ${link('/biblioteca', 'Pesquisar')}
          </div>
          <div class="social-topic-cloud">
            ${topics.length
              ? topics
                  .map(
                    (topic) => html`<a
                      href="/biblioteca?q=${encodeURIComponent(topic)}"
                      data-link
                      >#${E(topic)}</a
                    >`,
                  )
                  .join('')
              : '<span class="muted small">Os assuntos aparecem conforme a comunidade publica.</span>'}
          </div>
        </div>
      </aside>

      <main class="social-feed">
        <div class="social-discovery-strip">
          ${link('/coloquio', '<strong>Discussões</strong>Entre na conversa')}
          ${link('/projetos', '<strong>Projetos</strong>Veja o que estão criando')}
          ${link('/biblioteca', '<strong>Biblioteca</strong>Livros e pesquisas')}
          ${link('/oficina', '<strong>Tutoriais</strong>Aprenda fazendo')}
        </div>
        <div class="social-feed-tabs">
          <button class="active" type="button">Para você</button>
          ${link('/comunidades', 'Comunidades')}${link('/pesquisas', 'Em alta')}${link(
            '/coloquio',
            'Novos',
          )}
        </div>

        ${state.me
          ? html`<div class="social-composer">
              <span class="social-avatar">${E((state.me.displayName || 'S').slice(0, 1))}</span>
              <div>
                <strong>Compartilhe algo com a comunidade</strong>
                <p>Publique uma pesquisa, abra uma discussão ou mostre um projeto.</p>
              </div>
              <div class="actions">
                ${link('/publicar', 'Publicar', 'solid')}${link(
                  '/comunidades',
                  'Discutir',
                  'soft',
                )}
              </div>
            </div>`
          : html`<div class="social-composer guest">
              <div>
                <strong>Entre para fazer parte da conversa.</strong>
                <p>Siga comunidades, publique conhecimento e participe das discussões.</p>
              </div>
              <div class="actions">
                ${link('/cadastro', 'Criar conta', 'solid')}${link('/login', 'Entrar', 'outline')}
              </div>
            </div>`}

        <div class="social-feed-list">
          ${feed.length
            ? feed.map(feedPost).join('')
            : empty(
                'A timeline ainda não tem publicações. Seja a primeira pessoa a iniciar uma conversa.',
              )}
        </div>
      </main>

      <aside class="social-right">
        <div class="social-panel">
          <div class="social-panel-head">
            <h3>Projetos em alta</h3>
            ${link('/projetos', 'Ver todos')}
          </div>
          ${projects.length
            ? projects
                .map(
                  (project) => html`<a
                    class="social-list-item"
                    href="${projectHref(project)}"
                    data-link
                  >
                    <span class="project-mini">⌘</span>
                    <span>
                      <strong>${E(project.title)}</strong>
                      <small>
                        ${E(
                          (project.description || project.type || 'Projeto da comunidade').slice(
                            0,
                            70,
                          ),
                        )}
                      </small>
                    </span>
                  </a>`,
                )
                .join('')
            : '<p class="muted">Os primeiros projetos vão aparecer aqui.</p>'}
        </div>

        <div class="social-panel">
          <div class="social-panel-head">
            <h3>Leituras da comunidade</h3>
            ${link('/biblioteca', 'Biblioteca')}
          </div>
          ${books.length
            ? books
                .map(
                  (book) => html`<a
                    class="social-list-item"
                    href="/livros/${encodeURIComponent(book.id)}"
                    data-link
                  >
                    <span class="project-mini">▤</span>
                    <span>
                      <strong>${E(book.title)}</strong>
                      <small>${E(book.author || book.category || 'Livro recomendado')}</small>
                    </span>
                  </a>`,
                )
                .join('')
            : '<p class="muted">As recomendações de livros aparecerão aqui.</p>'}
        </div>

        <div class="social-panel">
          <div class="social-panel-head">
            <h3>Especialistas verificados</h3>
            ${link('/autores', 'Pessoas')}
          </div>
          ${(verified.length ? verified : profiles)
            .map(
              (profile) => html`<a
                class="social-list-item"
                href="/autores/${encodeURIComponent(profile.username)}"
                data-link
              >
                <span class="social-avatar">
                  ${E((profile.displayName || profile.username || 'S').slice(0, 1))}
                </span>
                <span>
                  <strong>${E(profile.displayName || profile.username)}</strong>
                  <small>
                    ${profile.verificationStatus === 'verified' ||
                    profile.verificationStatus === 'approved'
                      ? '✓ '
                      : ''}${E(profile.verifiedSpecialty || profile.profileType || 'Membro')}
                  </small>
                </span>
              </a>`,
            )
            .join('')}
        </div>

        <div class="social-panel social-quote">
          <span>“</span>
          <p>Grandes ideias começam com boas discussões.</p>
          <small>Studiorium</small>
        </div>
      </aside>
    </section>
  `);
}

export { home };

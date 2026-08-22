import { app, state, E, date, num } from '../runtime.js';

function link(path, label, cls = '') {
  return `<a href="${path}" data-link class="${cls}">${label}</a>`;
}

function navigationSection(route) {
  if (
    route.startsWith('/pesquisas/') ||
    route.startsWith('/projetos/') ||
    route.startsWith('/autores/') ||
    route.startsWith('/livros/')
  ) {
    return '/biblioteca';
  }
  if (
    route.startsWith('/atelie') ||
    route.startsWith('/estudio-templates') ||
    route.startsWith('/modelos-livres/') ||
    route.startsWith('/templates/')
  ) {
    return '/comunidades';
  }
  if (route.startsWith('/redacao')) return '/noticias';
  if (route.startsWith('/oficina') || route.startsWith('/laboratorio')) return '/comunidades';
  if (route.startsWith('/admin') || route === '/moderacao') return '/admin';
  return route;
}

function nav() {
  const route = navigationSection(location.pathname);
  const settings = state.boot?.settings || {};
  const title = String(settings.site_title || 'Studiorium');
  const items = [
    ['/biblioteca', 'Biblioteca'],
    ['/noticias', 'Notícias'],
    ['/comunidades', 'Comunidades'],
    ['/escrivaninha', 'Escrivaninha'],
  ];

  if (state.me?.role === 'admin') {
    items.push(['/admin', 'ADM']);
  }

  const desktopLinks = items
    .map(([path, label]) => {
      const active = route.startsWith(path) ? 'active' : '';
      return `<a href="${path}" data-link class="${active}">${label}</a>`;
    })
    .join('');

  const unreadBadge = state.unreadNotificationCount
    ? `<strong>${Math.min(state.unreadNotificationCount, 99)}</strong>`
    : '';

  const accountActions = state.me
    ? [
        '<button class="notification-trigger" type="button" data-notifications',
        ' aria-label="Abrir notificações" aria-expanded="false">',
        '<span aria-hidden="true">♢</span>',
        unreadBadge,
        '</button>',
        `<a href="/escrivaninha" data-link class="outline">${E(
          state.me.displayName.split(' ')[0],
        )}</a>`,
        '<button class="iconbtn mobile" data-menu aria-label="Abrir menu">☰</button>',
      ].join('')
    : [
        '<a href="/login" data-link class="outline">Entrar</a>',
        settings.registrations_open === false
          ? ''
          : '<a href="/cadastro" data-link class="solid">Criar conta</a>',
        '<button class="iconbtn mobile" data-menu aria-label="Abrir menu">☰</button>',
      ].join('');

  const mobileLinks = items
    .map(([path, label]) => {
      const style = [
        'display:block',
        'padding:10px 0',
        'color:var(--muted)',
        'text-transform:uppercase',
        'font-size:11px',
        'letter-spacing:.1em',
      ].join(';');
      return `<a href="${path}" data-link style="${style}">${label}</a>`;
    })
    .join('');

  return [
    '<nav class="nav">',
    '<div class="shell navin">',
    '<a href="/" data-link class="brand">',
    '<span class="seal">S</span>',
    `<span><strong>${E(title)}</strong><small>Ars · Scientia · Disciplina</small></span>`,
    '</a>',
    `<div class="navlinks">${desktopLinks}</div>`,
    `<div class="nav-actions">${accountActions}</div>`,
    '</div>',
    `<div id="mobileMenu" class="hidden shell" style="padding:0 0 16px">${mobileLinks}</div>`,
    state.me ? notificationPanel() : '',
    '</nav>',
  ].join('');
}

function notificationPanel() {
  const readAllButton = state.unreadNotificationCount
    ? '<button class="soft" type="button" data-notifications-read-all>Marcar lidas</button>'
    : '';

  const notifications = state.notifications.length
    ? state.notifications
        .map((item) => {
          const unreadClass = item.readAt ? '' : 'unread';
          return [
            `<button type="button" class="notification-item ${unreadClass}"`,
            ` data-notification-open="${E(item.id)}"`,
            ` data-notification-link="${E(item.link || '')}">`,
            '<span class="notification-mark" aria-hidden="true"></span>',
            '<span>',
            `<strong>${E(item.title)}</strong>`,
            `<small>${E(item.message)}</small>`,
            `<time>${date(item.createdAt)}</time>`,
            '</span>',
            '</button>',
          ].join('');
        })
        .join('')
    : '<div class="empty">Nenhuma notificação por enquanto.</div>';

  return [
    '<aside class="notification-panel" data-notification-panel aria-label="Notificações">',
    '<div class="notification-head">',
    '<div><span class="eyebrow">Nuntii</span><h2>Notificações</h2></div>',
    '<div class="actions">',
    readAllButton,
    '<button class="iconbtn" type="button" data-notifications-close aria-label="Fechar">×</button>',
    '</div>',
    '</div>',
    `<div class="notification-list">${notifications}</div>`,
    '</aside>',
  ].join('');
}

function footer() {
  const exploreLinks = [
    link('/biblioteca', 'Biblioteca'),
    link('/biblioteca?tipo=pesquisas', 'Pesquisas'),
    link('/biblioteca?tipo=pessoas', 'Pessoas'),
    link('/noticias', 'Notícias'),
  ].join('');

  const platformLinks = [
    link('/comunidades', 'Comunidades'),
    link('/comunidades/design-templates', 'Criação e modelos'),
    link('/escrivaninha', 'Escrivaninha'),
    link('/diretrizes', 'Diretrizes'),
    link('/sobre', 'Sobre o projeto'),
  ].join('');

  return [
    '<footer class="footer"><div class="shell footergrid">',
    '<div><div class="brand"><span class="seal">S</span>',
    '<span><strong>Studiorium</strong><small>Bibliotheca digitalis</small></span></div>',
    '<p>Uma plataforma para pesquisar, criar e compartilhar conhecimento com autoria, ',
    'organização e responsabilidade.</p></div>',
    `<div><h4>Explorar</h4>${exploreLinks}</div>`,
    `<div><h4>Studiorium</h4>${platformLinks}</div>`,
    '</div></footer>',
  ].join('');
}

function layout(content, opts = {}) {
  const settings = state.boot?.settings || {};
  const maintenanceAlert = settings.maintenance_mode
    ? [
        '<div class="site-alert danger"><div class="shell">',
        '<strong>Modo de manutenção ativo.</strong> ',
        'O site continua acessível para revisão do administrador.',
        '</div></div>',
      ].join('')
    : '';
  const noticeAlert = settings.site_notice
    ? `<div class="site-alert"><div class="shell">${E(settings.site_notice)}</div></div>`
    : '';
  const alerts = `${maintenanceAlert}${noticeAlert}`;
  const footerContent = opts.noFooter ? '' : footer();
  app.innerHTML = `${nav()}${alerts}<main id="conteudo">${content}</main>${footerContent}`;
}

function empty(text) {
  return `<div class="empty">${E(text)}</div>`;
}

function requireLogin() {
  const actions = `${link('/login', 'Entrar', 'solid')}${link('/cadastro', 'Criar conta', 'outline')}`;
  const content = [
    '<section class="pagehero"><div class="shell">',
    '<div class="card" style="max-width:620px;margin:auto;text-align:center">',
    '<div class="eyebrow">Área reservada</div>',
    '<h1 class="pagetitle">Entre para continuar</h1>',
    '<p>Essa função salva conteúdo em sua conta online do Studiorium.</p>',
    `<div class="actions" style="justify-content:center">${actions}</div>`,
    '</div></div></section>',
  ].join('');
  layout(content);
}

function notFound() {
  const content = [
    '<div class="errorpage"><div class="eyebrow">Error 404</div>',
    '<h1>Página não encontrada</h1>',
    '<p>Este registro não existe no arquivo do Studiorium.</p>',
    link('/', 'Voltar ao início', 'solid'),
    '</div>',
  ].join('');
  layout(content);
}

function templateCard(template, index = 0) {
  const categoryNumber = String(index + 1).padStart(2, '0');
  const featured = template.featured ? '<span class="brass">Destaque</span>' : '';
  const href = `/templates/${encodeURIComponent(template.slug)}`;

  return [
    `<a href="${href}" data-link class="card hover">`,
    `<div class="catno">CRIAÇÃO ${categoryNumber}</div>`,
    `<h3>${E(template.title)}</h3>`,
    `<p>${E(template.description || 'Modelo da comunidade pronto para adaptar.')}</p>`,
    '<div class="pills">',
    `<span class="pill">${E(template.category)}</span>`,
    `<span class="pill">${E(template.docType)}</span>`,
    `<span class="pill">${E(template.style || 'Clássico')}</span>`,
    '</div><div class="rule"></div>',
    `<div class="meta"><span>${num(template.downloads)} consultas</span>${featured}</div>`,
    '</a>',
  ].join('');
}

function publicationCard(publication) {
  const publicationPath = '/pesquisas/' + encodeURIComponent(publication.slug);
  const cover = publication.coverName
    ? [
        '<img class="publication-cover"',
        ` src="/api/publications/${encodeURIComponent(publication.id)}/cover"`,
        ` alt="Foto de apresentação de ${E(publication.title)}" loading="lazy" />`,
      ].join('')
    : '';
  const abstract = E((publication.abstract || '').slice(0, 180));
  const abstractSuffix = (publication.abstract || '').length > 180 ? '…' : '';
  const keywords = (publication.keywords || [])
    .slice(0, 4)
    .map((keyword) => `<span class="pill">${E(keyword)}</span>`)
    .join('');

  return [
    '<article class="card hover publication-card">',
    cover,
    `<div class="eyebrow">${E(publication.area || 'Pesquisa')}</div>`,
    `<h3>${link(publicationPath, E(publication.title), 'library-title')}</h3>`,
    `<p>${abstract}${abstractSuffix}</p>`,
    `<div class="pills">${keywords}</div><div class="rule"></div>`,
    '<div class="meta">',
    `<span>por ${E(publication.authorName)}</span>`,
    `<span>${num(publication.views)} leituras</span>`,
    `<span><strong data-boost-count="${E(publication.id)}">${num(
      publication.boosts,
    )}</strong> impulsos</span>`,
    `<span>${date(publication.createdAt)}</span>`,
    '</div><div class="actions publication-actions">',
    link(publicationPath, 'Abrir trabalho', 'outline'),
    `<button class="soft" type="button" data-publication-boost="${E(
      publication.id,
    )}">Impulsionar</button>`,
    '</div></article>',
  ].join('');
}

function discussionRow(discussion, index, basePath = '/coloquio') {
  const cleanBasePath = String(basePath || '/coloquio').replace(/\/$/, '');
  const href = `${cleanBasePath}/${encodeURIComponent(discussion.id)}`;
  const categoryNumber = String(index + 1).padStart(2, '0');
  return [
    `<a href="${href}" data-link class="discussion-row"><span>`,
    `<span class="catno">${categoryNumber}</span> &nbsp; `,
    `<strong>${E(discussion.title)}</strong></span>`,
    `<small>${E(discussion.category)}</small></a>`,
  ].join('');
}

export {
  link,
  nav,
  footer,
  layout,
  empty,
  requireLogin,
  notFound,
  templateCard,
  publicationCard,
  discussionRow,
};

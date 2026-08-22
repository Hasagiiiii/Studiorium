import { app, state, E, date, num, html } from '../runtime.js';

const CREATION_COMMUNITY_PATH = '/comunidades/design-templates';

function link(path, label, cls = '') {
  return html`<a href="${path}" data-link class="${cls}">${label}</a>`;
}

function nav() {
  const r = location.pathname;
  const settings = state.boot?.settings || {};
  const title = String(settings.site_title || 'Studiorium');
  const items = [
    ['/biblioteca', 'Biblioteca'],
    ['/projetos', 'Projetos'],
    ['/noticias', 'Notícias'],
    ['/oficina', 'Oficina'],
    [CREATION_COMMUNITY_PATH, 'Criação'],
    ['/comunidades', 'Comunidades'],
    ['/escrivaninha', 'Escrivaninha'],
  ];
  if (state.me?.role === 'admin') items.push(['/admin', 'ADM']);
  return html`<nav class="nav">
    <div class="shell navin">
      <a href="/" data-link class="brand"
        ><span class="seal">S</span
        ><span><strong>${E(title)}</strong><small>Ars · Scientia · Disciplina</small></span></a
      >
      <div class="navlinks">
        ${items
          .map(
            ([p, l]) =>
              html`<a href="${p}" data-link class="${r.startsWith(p) ? 'active' : ''}">${l}</a>`,
          )
          .join('')}
      </div>
      <div class="nav-actions">
        ${state.me
          ? html`<button
                class="notification-trigger"
                type="button"
                data-notifications
                aria-label="Abrir notificações"
                aria-expanded="false"
              >
                <span aria-hidden="true">♢</span>
                ${state.unreadNotificationCount
                  ? html`<strong>${Math.min(state.unreadNotificationCount, 99)}</strong>`
                  : ''}</button
              ><a href="/escrivaninha" data-link class="outline"
                >${E(state.me.displayName.split(' ')[0])}</a
              ><button class="iconbtn mobile" data-menu aria-label="Abrir menu">☰</button>`
          : html`<a href="/login" data-link class="outline">Entrar</a
              >${settings.registrations_open === false
                ? ''
                : html`<a href="/cadastro" data-link class="solid">Criar conta</a>`}<button
                class="iconbtn mobile"
                data-menu
                aria-label="Abrir menu"
              >
                ☰
              </button>`}
      </div>
    </div>
    <div id="mobileMenu" class="hidden shell" style="padding:0 0 16px">
      ${items
        .map(
          ([p, l]) =>
            html`<a
              href="${p}"
              data-link
              style="display:block;padding:10px 0;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.1em"
              >${l}</a
            >`,
        )
        .join('')}
    </div>
    ${state.me ? notificationPanel() : ''}
  </nav>`;
}

function notificationPanel() {
  return html`<aside class="notification-panel" data-notification-panel aria-label="Notificações">
    <div class="notification-head">
      <div>
        <span class="eyebrow">Nuntii</span>
        <h2>Notificações</h2>
      </div>
      <div class="actions">
        ${state.unreadNotificationCount
          ? html`<button class="soft" type="button" data-notifications-read-all>
              Marcar lidas
            </button>`
          : ''}
        <button class="iconbtn" type="button" data-notifications-close aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
    <div class="notification-list">
      ${state.notifications.length
        ? state.notifications
            .map(
              (item) =>
                html`<button
                  type="button"
                  class="notification-item ${item.readAt ? '' : 'unread'}"
                  data-notification-open="${E(item.id)}"
                  data-notification-link="${E(item.link || '')}"
                >
                  <span class="notification-mark" aria-hidden="true"></span>
                  <span>
                    <strong>${E(item.title)}</strong>
                    <small>${E(item.message)}</small>
                    <time>${date(item.createdAt)}</time>
                  </span>
                </button>`,
            )
            .join('')
        : html`<div class="empty">Nenhuma notificação por enquanto.</div>`}
    </div>
  </aside>`;
}

function footer() {
  return html`<footer class="footer">
    <div class="shell footergrid">
      <div>
        <div class="brand">
          <span class="seal">S</span
          ><span><strong>Studiorium</strong><small>Bibliotheca digitalis</small></span>
        </div>
        <p>
          Uma plataforma para criar, publicar, pesquisar e discutir conhecimento com autoria,
          organização e responsabilidade.
        </p>
      </div>
      <div>
        <h4>Studiorium</h4>
        ${link('/biblioteca', 'Biblioteca')}${link('/pesquisas', 'Pesquisas')}${link(
          '/autores',
          'Autores',
        )}${link('/comunidades', 'Comunidades')}${link(
          '/diretrizes',
          'Diretrizes da comunidade',
        )}
      </div>
      <div>
        <h4>Criar</h4>
        ${link(CREATION_COMMUNITY_PATH, 'Comunidade de Criação')}${link(
          '/estudio-templates',
          'Estúdio Criativo',
        )}${link('/atelie', 'Ateliê Científico')}${link(
          '/publicar',
          'Publicar pesquisa',
        )}${link('/redacao', 'Redação colaborativa')}${link('/sobre', 'Sobre o projeto')}
      </div>
    </div>
  </footer>`;
}

function layout(content, opts = {}) {
  const settings = state.boot?.settings || {};
  const alerts = `${
    settings.maintenance_mode
      ? html`<div class="site-alert danger">
          <div class="shell">
            <strong>Modo de manutenção ativo.</strong> O site continua acessível para revisão do
            administrador.
          </div>
        </div>`
      : ''
  }${settings.site_notice ? html`<div class="site-alert"><div class="shell">${E(settings.site_notice)}</div></div>` : ''}`;
  app.innerHTML = `${nav()}${alerts}<main id="conteudo">${content}</main>${opts.noFooter ? '' : footer()}`;
}

function empty(text) {
  return html`<div class="empty">${E(text)}</div>`;
}

function requireLogin() {
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="card" style="max-width:620px;margin:auto;text-align:center">
          <div class="eyebrow">Área reservada</div>
          <h1 class="pagetitle">Entre para continuar</h1>
          <p>Essa função salva conteúdo em sua conta online do Studiorium.</p>
          <div class="actions" style="justify-content:center">
            ${link('/login', 'Entrar', 'solid')}${link('/cadastro', 'Criar conta', 'outline')}
          </div>
        </div>
      </div>
    </section>`,
  );
}

function notFound() {
  layout(
    html`<div class="errorpage">
      <div class="eyebrow">Error 404</div>
      <h1>Página não encontrada</h1>
      <p>Este registro não existe no arquivo do Studiorium.</p>
      ${link('/', 'Voltar ao início', 'solid')}
    </div>`,
  );
}

function templateCard(t, i = 0) {
  return html`<a href="/templates/${encodeURIComponent(t.slug)}" data-link class="card hover"
    ><div class="catno">CRIAÇÃO ${String(i + 1).padStart(2, '0')}</div>
    <h3>${E(t.title)}</h3>
    <p>${E(t.description || 'Modelo acadêmico pronto para adaptar.')}</p>
    <div class="pills">
      <span class="pill">${E(t.category)}</span><span class="pill">${E(t.docType)}</span
      ><span class="pill">${E(t.style || 'Clássico')}</span>
    </div>
    <div class="rule"></div>
    <div class="meta">
      <span>${num(t.downloads)} usos</span>${t.featured
        ? '<span class="brass">Destaque</span>'
        : ''}
    </div></a
  >`;
}

function publicationCard(p) {
  return html`<article class="card hover publication-card">
    ${p.coverName
      ? html`<img
          class="publication-cover"
          src="/api/publications/${encodeURIComponent(p.id)}/cover"
          alt="Foto de apresentação de ${E(p.title)}"
          loading="lazy"
        />`
      : ''}
    <div class="eyebrow">${E(p.area || 'Pesquisa')}</div>
    <h3>${link('/pesquisas/' + encodeURIComponent(p.slug), E(p.title), 'library-title')}</h3>
    <p>${E((p.abstract || '').slice(0, 180))}${(p.abstract || '').length > 180 ? '…' : ''}</p>
    <div class="pills">
      ${(p.keywords || [])
        .slice(0, 4)
        .map((k) => html`<span class="pill">${E(k)}</span>`)
        .join('')}
    </div>
    <div class="rule"></div>
    <div class="meta">
      <span>por ${E(p.authorName)}</span><span>${num(p.views)} leituras</span
      ><span><strong data-boost-count="${E(p.id)}">${num(p.boosts)}</strong> impulsos</span
      ><span>${date(p.createdAt)}</span>
    </div>
    <div class="actions publication-actions">
      ${link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir trabalho', 'outline')}
      <button class="soft" type="button" data-publication-boost="${E(p.id)}">Impulsionar</button>
    </div>
  </article>`;
}

function discussionRow(d, i, basePath = '/coloquio') {
  const href = `${String(basePath || '/coloquio').replace(/\/$/, '')}/${encodeURIComponent(d.id)}`;
  return html`<a href="${href}" data-link class="discussion-row"
    ><span
      ><span class="catno">${String(i + 1).padStart(2, '0')}</span> &nbsp;
      <strong>${E(d.title)}</strong></span
    ><small>${E(d.category)}</small></a
  >`;
}

export {
  CREATION_COMMUNITY_PATH,
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

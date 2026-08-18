import { app, state, E, date, num, html } from '../runtime.js';

function link(path, label, cls = '') {
  return html`<a href="${path}" data-link class="${cls}">${label}</a>`;
}

function nav() {
  const r = location.pathname;
  const settings = state.boot?.settings || {};
  const title = String(settings.site_title || 'Studiorium');
  const items = [
    ['/biblioteca', 'Biblioteca'],
    ['/oficina', 'Tech & Oficina'],
    ['/acervo', 'Acervo'],
    ['/atelie', 'Ateliê Científico'],
    ['/coloquio', 'Colóquio'],
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
          ? html`<a href="/escrivaninha" data-link class="outline"
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
  </nav>`;
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
        ${link('/biblioteca', 'Biblioteca')}${link('/acervo', 'Acervo')}${link(
          '/pesquisas',
          'Pesquisas',
        )}${link('/autores', 'Autores')}${link('/diretrizes', 'Diretrizes da comunidade')}
      </div>
      <div>
        <h4>Criar</h4>
        ${link('/atelie', 'Ateliê Científico')}${link('/publicar', 'Publicar pesquisa')}${link(
          '/coloquio',
          'Abrir discussão',
        )}${link('/sobre', 'Sobre o projeto')}
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

function templateCard(t, i = 0) {
  return html`<a href="/templates/${encodeURIComponent(t.slug)}" data-link class="card hover"
    ><div class="catno">CAT. ${String(i + 1).padStart(2, '0')}</div>
    <h3>${E(t.title)}</h3>
    <p>${E(t.description || 'Modelo acadêmico pronto para adaptar.')}</p>
    <div class="pills">
      <span class="pill">${E(t.category)}</span><span class="pill">${E(t.docType)}</span
      ><span class="pill">${E(t.style || 'Clássico')}</span>
    </div>
    <div class="rule"></div>
    <div class="meta">
      <span>${num(t.downloads)} consultas</span>${t.featured
        ? '<span class="brass">Destaque</span>'
        : ''}
    </div></a
  >`;
}

function publicationCard(p) {
  return html`<a href="/pesquisas/${encodeURIComponent(p.slug)}" data-link class="card hover"
    ><div class="eyebrow">${E(p.area || 'Pesquisa')}</div>
    <h3>${E(p.title)}</h3>
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
      ><span>${date(p.createdAt)}</span>
    </div></a
  >`;
}

function discussionRow(d, i) {
  return html`<a href="/coloquio/${encodeURIComponent(d.id)}" data-link class="discussion-row"
    ><span
      ><span class="catno">${String(i + 1).padStart(2, '0')}</span> &nbsp;
      <strong>${E(d.title)}</strong></span
    ><small>${E(d.category)}</small></a
  >`;
}

export { link, nav, footer, layout, empty, templateCard, publicationCard, discussionRow };

import { state, E, date, num, initials, html } from '../runtime.js';
import { emergentTopics, rankRelated } from '../content-intelligence.js';
import { link, layout, empty, notFound, templateCard } from './core.js';

function libraryPublicationCard(p) {
  const profile = state.boot.profiles.find(
    (x) => x.userId === p.ownerId || x.displayName === p.authorName,
  );
  return html`<article class="card library-card">
    ${p.coverName
      ? html`<img
          class="publication-cover"
          src="/api/publications/${encodeURIComponent(p.id)}/cover"
          alt="Foto de apresentação de ${E(p.title)}"
          loading="lazy"
        />`
      : ''}
    <div class="eyebrow">${E(p.area || 'Pesquisa')} · ${E(p.level || 'Trabalho acadêmico')}</div>
    <h3>${link('/pesquisas/' + encodeURIComponent(p.slug), E(p.title), 'library-title')}</h3>
    <p>${E((p.abstract || '').slice(0, 220))}${(p.abstract || '').length > 220 ? '…' : ''}</p>
    <div class="pills">
      ${(p.keywords || [])
        .slice(0, 5)
        .map((k) => html`<span class="pill">${E(k)}</span>`)
        .join('')}
    </div>
    <div class="rule"></div>
    <div class="meta">
      <span
        >Autor:
        ${profile
          ? link('/autores/' + encodeURIComponent(profile.username), E(p.authorName), 'authorlink')
          : E(p.authorName)}</span
      ><span>${num(p.views)} leituras</span><span>${date(p.createdAt)}</span>
      <span><strong data-boost-count="${E(p.id)}">${num(p.boosts)}</strong> impulsos</span>
    </div>
    <div class="actions" style="margin-top:18px">
      ${link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir trabalho', 'outline')}${profile
        ? link('/autores/' + encodeURIComponent(profile.username), 'Ver autor', 'soft')
        : ''}<button class="soft" type="button" data-publication-boost="${E(p.id)}">
        Impulsionar
      </button>
    </div>
  </article>`;
}

function bookCard(book) {
  return html`<article class="book-card">
    <div class="book-cover theme-${E(book.coverTheme)}" aria-hidden="true">
      <span>Studiorium</span><strong>${E(book.title)}</strong><small>${E(book.author)}</small>
    </div>
    <div class="book-copy">
      <div class="eyebrow">${E(book.category)}</div>
      <h3>${E(book.title)}</h3>
      <p class="book-author">${E(book.author)}</p>
      <p>${E(book.description)}</p>
      <button class="outline" type="button" data-book-save="${E(book.id)}:want_to_read">
        Guardar na minha estante
      </button>
    </div>
  </article>`;
}

function biblioteca() {
  const boot = state.boot;
  const q = (state.query.get('q') || '').trim();
  const tipo = state.query.get('tipo') || '';
  const area = state.query.get('area') || '';
  const nivel = state.query.get('nivel') || '';
  const autor = state.query.get('autor') || '';
  const palavra = (state.query.get('palavra') || '').trim();
  const norm = (v) => String(v || '').toLocaleLowerCase('pt-BR');
  const contains = (obj, term) => !term || norm(JSON.stringify(obj)).includes(norm(term));
  const areas = [
    ...new Set(
      [
        ...boot.publications.map((p) => p.area),
        ...(boot.books || []).map((book) => book.category),
      ].filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const niveis = [...new Set(boot.publications.map((p) => p.level).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const autores = [...new Set(boot.publications.map((p) => p.authorName).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  );
  const pubs =
    tipo === 'livros'
      ? []
      : boot.publications.filter(
          (p) =>
            contains(p, q) &&
            (!area || p.area === area) &&
            (!nivel || p.level === nivel) &&
            (!autor || p.authorName === autor) &&
            (!palavra || (p.keywords || []).some((k) => norm(k).includes(norm(palavra)))),
        );
  const books =
    tipo === 'pesquisas'
      ? []
      : (boot.books || []).filter(
          (book) =>
            contains(book, q) && (!area || book.category === area) && !nivel && !autor && !palavra,
        );
  const authorMatches = boot.profiles.filter(
    (p) => (!q || contains(p, q)) && (!autor || p.displayName === autor),
  );
  const total = pubs.length + books.length;
  const circulatingTopics = emergentTopics(boot.publications);
  layout(
    html`<section class="pagehero library-hero">
        <div class="shell">
          <div class="eyebrow">Bibliotheca Studiorum</div>
          <h1 class="pagetitle">Biblioteca</h1>
          <p>
            O catálogo central do Studiorium. Encontre pesquisas, trabalhos acadêmicos, livros e
            autores por tema, área, nível, autoria ou palavras-chave.
          </p>
          <div class="stats library-stats">
            <div class="stat">
              <strong>${boot.publications.length}</strong><span>Trabalhos publicados</span>
            </div>
            <div class="stat">
              <strong>${(boot.books || []).length}</strong><span>Livros na estante</span>
            </div>
            <div class="stat">
              <strong>${boot.profiles.length}</strong><span>Autores públicos</span>
            </div>
            <div class="stat"><strong>${total}</strong><span>Resultados atuais</span></div>
          </div>
          <form class="library-filter" data-library-filter>
            <div class="library-search">
              <span>⌕</span
              ><input
                class="field"
                name="q"
                value="${E(q)}"
                placeholder="Pesquisar título, resumo, autor, tema ou conteúdo…"
              /><button class="solid">Pesquisar</button>
            </div>
            <div class="library-filters">
              <select class="select" name="tipo">
                <option value="">Tudo na biblioteca</option>
                <option value="pesquisas" ${tipo === 'pesquisas' ? 'selected' : ''}>
                  Pesquisas e trabalhos
                </option>
                <option value="livros" ${tipo === 'livros' ? 'selected' : ''}>
                  Livros da estante
                </option></select
              ><select class="select" name="area">
                <option value="">Todas as áreas</option>
                ${areas
                  .map(
                    (a) =>
                      html`<option value="${E(a)}" ${a === area ? 'selected' : ''}>
                        ${E(a)}
                      </option>`,
                  )
                  .join('')}</select
              ><select class="select" name="nivel">
                <option value="">Todos os níveis</option>
                ${niveis
                  .map(
                    (n) =>
                      html`<option value="${E(n)}" ${n === nivel ? 'selected' : ''}>
                        ${E(n)}
                      </option>`,
                  )
                  .join('')}</select
              ><select class="select" name="autor">
                <option value="">Todos os autores</option>
                ${autores
                  .map(
                    (a) =>
                      html`<option value="${E(a)}" ${a === autor ? 'selected' : ''}>
                        ${E(a)}
                      </option>`,
                  )
                  .join('')}</select
              ><input
                class="field"
                name="palavra"
                value="${E(palavra)}"
                placeholder="Palavra-chave"
              /><button class="outline" type="button" data-library-clear>Limpar filtros</button>
            </div>
          </form>
          ${total
            ? html`<div class="library-summary">
                <strong>${total}</strong> resultado${total === 1 ? '' : 's'}
                encontrado${total === 1 ? '' : 's'}${q ? ` para “${E(q)}”` : ''}.
              </div>`
            : ''}
          ${circulatingTopics.length
            ? html`<div class="discovery-strip">
                <div>
                  <span class="eyebrow">Índice emergente</span>
                  <strong>Temas em circulação na biblioteca</strong>
                </div>
                <div class="discovery-topics">
                  ${circulatingTopics
                    .map(
                      (topic) =>
                        html`<a href="/biblioteca?q=${encodeURIComponent(topic.label)}" data-link>
                          ${E(topic.label)} <span>${topic.count}</span>
                        </a>`,
                    )
                    .join('')}
                </div>
              </div>`
            : ''}
        </div>
      </section>
      <section class="section compact">
        <div class="shell">
          ${pubs.length
            ? html`<div class="sectionhead">
                  <div>
                    <div class="eyebrow">Opera publica</div>
                    <h2>Pesquisas e trabalhos</h2>
                    <p>
                      Publicações da comunidade com autoria, nível, área, resumo e palavras-chave.
                    </p>
                  </div>
                  ${link('/pesquisas', 'Ver somente pesquisas →', 'linkbtn')}
                </div>
                <div class="grid grid3">${pubs.map(libraryPublicationCard).join('')}</div>`
            : ''}${books.length
            ? html`<div class="sectionhead library-section-gap">
                  <div>
                    <div class="eyebrow">Armarium librorum</div>
                    <h2>Estante de livros</h2>
                    <p>
                      Obras para ampliar repertório em literatura, ciência, filosofia e educação.
                    </p>
                  </div>
                </div>
                <div class="book-shelf">${books.map(bookCard).join('')}</div>`
            : ''}${!total
            ? empty(
                'Nenhum item da biblioteca corresponde a esses filtros. Tente remover um filtro ou usar outra palavra.',
              )
            : ''}${q && authorMatches.length
            ? html`<div class="sectionhead library-section-gap">
                  <div>
                    <div class="eyebrow">Auctores</div>
                    <h2>Autores relacionados</h2>
                  </div>
                  ${link('/autores', 'Ver todos os autores →', 'linkbtn')}
                </div>
                <div class="grid grid3">
                  ${authorMatches
                    .slice(0, 6)
                    .map(
                      (p) =>
                        html`<a
                          href="/autores/${encodeURIComponent(p.username)}"
                          data-link
                          class="card hover"
                          ><div class="avatar" style="width:58px;height:58px;font-size:23px">
                            ${E(initials(p.displayName))}
                          </div>
                          <h3>${E(p.displayName)}</h3>
                          <div class="pills"><span class="pill">${E(p.profileType)}</span></div>
                          <p>${E(p.bio || 'Perfil público da comunidade Studiorium.')}</p></a
                        >`,
                    )
                    .join('')}
                </div>`
            : ''}
        </div>
      </section>`,
  );
}

function templateDetail(slug) {
  const t = state.boot.templates.find((x) => x.slug === slug);
  if (!t) return notFound();
  const relatedTemplates = rankRelated(t, state.boot.templates);
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="crumbs">${link('/comunidades/design-templates', 'Criação e modelos')} / ${E(
          t.title,
        )}</div>
        <div class="grid grid2">
          <div>
            <div class="eyebrow">${E(t.category)} · ${E(t.docType)}</div>
            <h1 class="pagetitle">${E(t.title)}</h1>
            <p>${E(t.description)}</p>
            <div class="pills">
              <span class="pill">${E(t.style)}</span
              ><span class="pill">${num(t.downloads)} consultas</span>
            </div>
            <div class="actions" style="margin-top:24px">
              <button class="solid" data-use-template="${E(t.slug)}">Usar este modelo</button
              >${link('/atelie', 'Abrir no Ateliê', 'outline')}
            </div>
          </div>
          <div class="paper" style="min-height:430px">
            <div class="eyebrow" style="color:#6d5b43">Studiorium · Modelo</div>
            <div class="doctitle">${E(t.title)}</div>
            ${t.sections
              .map(
                (s) =>
                  html`<h2>${E(s)}</h2>
                    <p style="line-height:1.7;color:#5b5143">
                      Comece a escrever esta seção seguindo as orientações da sua instituição e as
                      exigências do trabalho.
                    </p>`,
              )
              .join('')}
          </div>
        </div>
        ${relatedTemplates.length
          ? html`<section class="contextual-discovery">
              <div class="sectionhead">
                <div>
                  <div class="eyebrow">Modelos conectados</div>
                  <h2>Continue sem recomeçar do zero</h2>
                  <p>Seleção calculada pelo tipo, área, estrutura e estilo deste modelo.</p>
                </div>
              </div>
              <div class="grid grid3">${relatedTemplates.map(templateCard).join('')}</div>
            </section>`
          : ''}
      </div>
    </section>`,
  );
}

export { biblioteca, templateDetail };

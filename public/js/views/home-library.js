import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

function home() {
  const b = state.boot;
  const settings = b.settings || {};
  const templates = b.templates.filter((t) => t.featured).slice(0, 3);
  const discussions = b.discussions.slice(0, 3);
  const pubs = b.publications.slice(0, 3);
  const news = (b.news || []).slice(0, 3);
  layout(
    html` <section class="hero">
        <div class="shell">
          <div class="eyebrow">Bibliotheca digitalis para mentes curiosas</div>
          <h1>${E(settings.hero_title || 'Conhecimento que deixa vestígios.')}</h1>
          <p class="lead">
            ${E(
              settings.hero_text ||
                'Crie trabalhos, encontre modelos, publique descobertas e participe ' +
                  'de conversas acadêmicas em um espaço que valoriza autoria, rigor e repertório.',
            )}
          </p>
          <form class="searchbar" data-global-search>
            <span>⌕</span
            ><input
              name="q"
              aria-label="Pesquisar"
              placeholder="Procure autores, pesquisas, temas ou modelos…"
            /><button class="solid">Consultar</button>
          </form>
          <div class="quicklinks">
            ${link('/publicar', 'Publicar trabalho')}<span>✦</span>${link(
              '/atelie',
              'Criar banner científico',
            )}<span>✦</span>${link('/coloquio', 'Entrar no colóquio')}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="featuregrid">
            <a href="/biblioteca" data-link class="feature featurelink"
              ><div class="glyph">⌘</div>
              <h3>Biblioteca</h3>
              <p>
                Pesquise trabalhos, artigos, autores, áreas e palavras-chave em um catálogo
                acadêmico central.
              </p></a
            ><a href="/acervo" data-link class="feature featurelink"
              ><div class="glyph">▤</div>
              <h3>Acervo</h3>
              <p>
                Templates para escola, faculdade, pesquisa, banners e documentos acadêmicos,
                organizados para adaptação e estudo.
              </p></a
            ><a href="/noticias" data-link class="feature featurelink"
              ><div class="glyph">✦</div>
              <h3>Notícias</h3>
              <p>
                Matérias de estudantes e novos autores, com fontes declaradas, triagem por IA e
                certificação editorial humana.
              </p></a
            ><a href="/coloquio" data-link class="feature featurelink"
              ><div class="glyph">⌂</div>
              <h3>Colóquio</h3>
              <p>
                Abra discussões por área e tema, responda outros membros e denuncie conteúdos que
                violem as diretrizes.
              </p></a
            >
          </div>
        </div>
      </section>
      <section class="section compact editorial-home">
        <div class="shell">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Nuntii certificati</div>
              <h2>Notícias da comunidade</h2>
              <p>Informação com fontes visíveis e decisão editorial humana.</p>
            </div>
            ${link('/noticias', 'Abrir redação →', 'linkbtn')}
          </div>
          <div class="grid grid3">
            ${news
              .map(
                (article) =>
                  html`<article class="card news-card">
                    <div class="news-card-top">
                      <span class="eyebrow">${E(article.category)}</span>
                      <span class="badge certified">✓ Certificada</span>
                    </div>
                    <h3>
                      ${link(
                        `/noticias/${encodeURIComponent(article.slug)}`,
                        E(article.title),
                        'library-title',
                      )}
                    </h3>
                    <p>${E(article.summary)}</p>
                    <div class="meta">
                      <span>${E(article.authorName)}</span><span>${date(article.publishedAt)}</span>
                    </div>
                  </article>`,
              )
              .join('') || empty('A redação está preparando as primeiras notícias.')}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="shell">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Exemplaria selecta</div>
              <h2>Modelos em destaque</h2>
            </div>
            ${link('/acervo', 'Ver acervo →', 'linkbtn')}
          </div>
          <div class="grid grid3">
            ${templates.map(templateCard).join('') || empty('O acervo ainda está vazio.')}
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="shell">
          <div class="split">
            <div>
              <div class="eyebrow">Colloquium</div>
              <h2 class="pagetitle">Conversas que continuam depois da aula.</h2>
              <p class="muted" style="line-height:1.7">
                Discussões públicas organizadas por tema, com moderação, referências, contrapontos e
                perguntas bem formuladas.
              </p>
              <span class="badge">◇ Ambiente moderado</span>
            </div>
            <div>
              ${discussions.map(discussionRow).join('') || empty('Nenhuma discussão publicada.')}
            </div>
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="shell">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Scriptorium</div>
              <h2>Pesquisas recentes</h2>
            </div>
            ${link('/pesquisas', 'Abrir pesquisas →', 'linkbtn')}
          </div>
          <div class="grid grid3">
            ${pubs.map(publicationCard).join('') || empty('Nenhuma pesquisa publicada.')}
          </div>
        </div>
      </section>`,
  );
}

function libraryPublicationCard(p) {
  const profile = state.boot.profiles.find(
    (x) => x.userId === p.ownerId || x.displayName === p.authorName,
  );
  return html`<article class="card library-card">
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
    </div>
    <div class="actions" style="margin-top:18px">
      ${link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir trabalho', 'outline')}${profile
        ? link('/autores/' + encodeURIComponent(profile.username), 'Ver autor', 'soft')
        : ''}
    </div>
  </article>`;
}

function libraryTemplateCard(t, i = 0) {
  return html`<article class="card library-card">
    <div class="catno">MODELO ${String(i + 1).padStart(2, '0')}</div>
    <h3>${link('/templates/' + encodeURIComponent(t.slug), E(t.title), 'library-title')}</h3>
    <p>${E(t.description || 'Modelo acadêmico pronto para adaptar.')}</p>
    <div class="pills">
      <span class="pill">${E(t.category)}</span><span class="pill">${E(t.docType)}</span
      ><span class="pill">${E(t.style || 'Clássico')}</span>
    </div>
    <div class="rule"></div>
    <div class="meta"><span>${num(t.downloads)} consultas</span><span>Acervo de modelos</span></div>
    <div class="actions" style="margin-top:18px">
      ${link('/templates/' + encodeURIComponent(t.slug), 'Abrir modelo', 'outline')}${link(
        '/acervo',
        'Ver acervo',
        'soft',
      )}
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
      [...boot.publications.map((p) => p.area), ...boot.templates.map((t) => t.category)].filter(
        Boolean,
      ),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const niveis = [...new Set(boot.publications.map((p) => p.level).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const autores = [...new Set(boot.publications.map((p) => p.authorName).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  );
  let pubs =
    tipo === 'modelos'
      ? []
      : boot.publications.filter(
          (p) =>
            contains(p, q) &&
            (!area || p.area === area) &&
            (!nivel || p.level === nivel) &&
            (!autor || p.authorName === autor) &&
            (!palavra || (p.keywords || []).some((k) => norm(k).includes(norm(palavra)))),
        );
  let templates =
    tipo === 'pesquisas'
      ? []
      : boot.templates.filter(
          (t) => contains(t, q) && (!area || t.category === area) && !nivel && !autor && !palavra,
        );
  const authorMatches = boot.profiles.filter(
    (p) => (!q || contains(p, q)) && (!autor || p.displayName === autor),
  );
  const total = pubs.length + templates.length;
  layout(
    html`<section class="pagehero library-hero">
        <div class="shell">
          <div class="eyebrow">Bibliotheca Studiorum</div>
          <h1 class="pagetitle">Biblioteca</h1>
          <p>
            O catálogo central do Studiorium. Encontre pesquisas, trabalhos acadêmicos, modelos e
            autores por tema, área, nível, autoria ou palavras-chave.
          </p>
          <div class="stats library-stats">
            <div class="stat">
              <strong>${boot.publications.length}</strong><span>Trabalhos publicados</span>
            </div>
            <div class="stat">
              <strong>${boot.templates.length}</strong><span>Modelos no acervo</span>
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
                <option value="modelos" ${tipo === 'modelos' ? 'selected' : ''}>
                  Modelos do acervo
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
            : ''}${templates.length
            ? html`<div class="sectionhead library-section-gap">
                  <div>
                    <div class="eyebrow">Catalogus exemplorum</div>
                    <h2>Modelos do acervo</h2>
                    <p>
                      Estruturas prontas para adaptar em atividades escolares, universitárias e
                      científicas.
                    </p>
                  </div>
                  ${link('/acervo', 'Abrir acervo →', 'linkbtn')}
                </div>
                <div class="grid grid3">${templates.map(libraryTemplateCard).join('')}</div>`
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

function acervo() {
  let q = state.query.get('q') || '';
  let cat = state.query.get('categoria') || '';
  const cats = [...new Set(state.boot.templates.map((t) => t.category))];
  let list = state.boot.templates.filter(
    (t) =>
      (!q || JSON.stringify(t).toLowerCase().includes(q.toLowerCase())) &&
      (!cat || t.category === cat),
  );
  const communityTemplates = (state.boot.customTemplates || []).filter(
    (template) => !q || JSON.stringify(template).toLowerCase().includes(q.toLowerCase()),
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Catalogus</div>
        <h1 class="pagetitle">Acervo de modelos</h1>
        <p>
          Use modelos prontos ou crie livremente com blocos, fotos, cores e arquivos importados.
        </p>
        <div class="actions space-top space-bottom">
          ${link('/estudio-templates', 'Criar template livre', 'solid')}
          <span class="small muted">Importe JSON, PNG, JPG, WebP ou PDF como referência.</span>
        </div>
        <form class="toolbar" data-acervo-filter>
          <input class="field" name="q" value="${E(q)}" placeholder="Pesquisar no acervo" /><select
            class="select"
            name="categoria"
          >
            <option value="">Todas as categorias</option>
            ${cats
              .map((c) => html`<option ${c === cat ? 'selected' : ''}>${E(c)}</option>`)
              .join('')}</select
          ><button class="solid">Filtrar</button>
        </form>
        <div class="grid grid3">
          ${list.map(templateCard).join('') || empty('Nenhum modelo encontrado com esses filtros.')}
        </div>
        ${communityTemplates.length
          ? html`<div class="sectionhead section-gap">
                <div>
                  <div class="eyebrow">Modelos da comunidade</div>
                  <h2>Templates livres publicados</h2>
                </div>
              </div>
              <div class="grid grid3">
                ${communityTemplates
                  .map(
                    (template) =>
                      html`<article class="card studio-card">
                        <span class="badge">Modelo editável</span>
                        <h3>${E(template.title)}</h3>
                        <p>${E(template.description || 'Template publicado pela comunidade.')}</p>
                        ${link(
                          `/modelos-livres/${encodeURIComponent(template.id)}`,
                          'Visualizar modelo',
                          'outline',
                        )}
                      </article>`,
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
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="crumbs">${link('/acervo', 'Acervo')} / ${E(t.title)}</div>
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
      </div>
    </section>`,
  );
}

export { home, libraryPublicationCard, libraryTemplateCard, biblioteca, acervo, templateDetail };

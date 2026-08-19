import { state, api, E, date, html } from '../runtime.js';
import { layout, link, empty } from './core.js';
import { rankRelated } from '../content-intelligence.js';

function newsCard(article) {
  return html`<article class="card news-card">
    <div class="news-card-top">
      <span class="eyebrow">${E(article.category)}</span>
      <span class="badge certified">✓ Certificada</span>
    </div>
    <h3>
      ${link(`/noticias/${encodeURIComponent(article.slug)}`, E(article.title), 'library-title')}
    </h3>
    <p>${E(article.summary)}</p>
    <div class="rule"></div>
    <div class="meta">
      <span>por ${E(article.authorName)}</span>
      <span>${date(article.publishedAt)}</span>
      <span>${article.sources.length} fonte${article.sources.length === 1 ? '' : 's'}</span>
    </div>
  </article>`;
}

function noticias() {
  const articles = state.boot.news || [];
  const featured = articles.find((article) => article.featured) || articles[0];
  const rest = articles.filter((article) => article.id !== featured?.id);
  layout(
    html`<section class="pagehero editorial-hero">
        <div class="shell editorial-hero-grid">
          <div>
            <div class="eyebrow">Nuntii · Redação colaborativa</div>
            <h1 class="pagetitle">Notícias com fontes, contexto e responsabilidade.</h1>
            <p>
              Estudantes de Jornalismo, Comunicação e áreas relacionadas podem propor matérias. A IA
              auxilia na triagem, mas toda certificação e publicação é decidida por uma pessoa da
              equipe editorial.
            </p>
            <div class="actions space-top">
              ${link('/redacao', 'Participar da redação', 'solid')}
              ${link('/diretrizes', 'Ler critérios editoriais', 'outline')}
            </div>
          </div>
          <aside class="certification-note">
            <span class="certification-seal">✓</span>
            <div>
              <strong>Certificação Studiorium</strong>
              <p>Fontes declaradas, triagem de risco e decisão editorial humana.</p>
            </div>
          </aside>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          ${featured
            ? html`<article class="featured-news">
                <div>
                  <div class="eyebrow">Em destaque · ${E(featured.category)}</div>
                  <h2>${E(featured.title)}</h2>
                  <p>${E(featured.summary)}</p>
                  <div class="meta">
                    <span>${E(featured.authorName)}</span>
                    <span>${date(featured.publishedAt)}</span>
                  </div>
                </div>
                <div class="featured-news-action">
                  <span class="badge certified">✓ Revisão humana concluída</span>
                  ${link(`/noticias/${encodeURIComponent(featured.slug)}`, 'Ler notícia', 'solid')}
                </div>
              </article>`
            : empty('A redação está preparando as primeiras notícias.')}
          <div class="sectionhead section-gap">
            <div>
              <div class="eyebrow">Arquivo editorial</div>
              <h2>Publicações recentes</h2>
            </div>
          </div>
          <div class="grid grid3">
            ${rest.map(newsCard).join('') || empty('Nenhuma outra notícia publicada.')}
          </div>
        </div>
      </section>`,
  );
}

async function newsDetail(slug) {
  const { article } = await api(`/api/news/public/${encodeURIComponent(slug)}`);
  const relatedNews = rankRelated(article, state.boot.news || []);
  layout(
    html`<section class="pagehero article-hero">
        <div class="shell article-width">
          <div class="crumbs">${link('/noticias', 'Notícias')} / ${E(article.category)}</div>
          <span class="badge certified">✓ Certificada pela redação</span>
          <h1 class="pagetitle">${E(article.title)}</h1>
          <p class="article-summary">${E(article.summary)}</p>
          <div class="meta article-meta">
            <span>Por ${E(article.authorName)}</span>
            <span>Publicada em ${date(article.publishedAt)}</span>
            <span>
              ${article.sources.length} fonte${article.sources.length === 1 ? '' : 's'}
              declarada${article.sources.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="shell article-layout">
          <article class="article-body">${E(article.body)}</article>
          <aside class="article-sources">
            <div class="eyebrow">Fontes da matéria</div>
            <h2>Confira a apuração</h2>
            <ol>
              ${article.sources
                .map(
                  (source) =>
                    html`<li>
                      <a href="${E(source.url)}" target="_blank" rel="noopener noreferrer">
                        ${E(source.title)} ↗
                      </a>
                    </li>`,
                )
                .join('')}
            </ol>
            <div class="notice ok">
              A IA foi usada apenas para identificar riscos e lacunas. A decisão de publicar foi
              humana e não transforma o texto em verdade absoluta.
            </div>
          </aside>
        </div>
        ${relatedNews.length
          ? html`<section class="contextual-discovery article-width">
              <div class="sectionhead">
                <div>
                  <div class="eyebrow">Contexto editorial</div>
                  <h2>Outras matérias para ampliar a leitura</h2>
                  <p>Seleção calculada por tema, categoria, resumo e vocabulário da apuração.</p>
                </div>
              </div>
              <div class="grid grid3">${relatedNews.map(newsCard).join('')}</div>
            </section>`
          : ''}
      </section>`,
  );
}

function contributorApplication(application) {
  if (application?.status === 'pending') {
    return html`<div class="notice">
      Seu credenciamento está em análise pela equipe editorial.
    </div>`;
  }
  return html`<form class="card newsroom-application" data-news-contributor>
    <div class="eyebrow">Credenciamento</div>
    <h2>
      ${application?.status === 'rejected' ? 'Atualizar candidatura' : 'Participar da redação'}
    </h2>
    ${application?.reviewNote
      ? html`<div class="notice danger">Retorno: ${E(application.reviewNote)}</div>`
      : ''}
    <div class="formgrid">
      <div>
        <label class="label">Área de estudo ou atuação</label>
        <input class="field" name="area" value="${E(application?.area || '')}" required />
      </div>
      <div>
        <label class="label">Instituição (opcional)</label>
        <input class="field" name="institution" value="${E(application?.institution || '')}" />
      </div>
    </div>
    <div class="formrow">
      <label class="label">Portfólio ou perfil acadêmico (opcional)</label>
      <input
        class="field"
        type="url"
        name="portfolioUrl"
        value="${E(application?.portfolioUrl || '')}"
      />
    </div>
    <div class="formrow">
      <label class="label">Conte sobre sua formação, experiência e interesse editorial</label>
      <textarea class="textarea" name="statement" minlength="40" required>
${E(application?.statement || '')}</textarea
      >
    </div>
    <button class="solid">Enviar para análise</button>
  </form>`;
}

function sourcesFields(sources = []) {
  const rows = [...sources, {}, {}].slice(0, Math.max(2, sources.length));
  return rows
    .map(
      (source, index) =>
        html`<div class="source-row" data-news-source>
          <span>${index + 1}</span>
          <input
            class="field"
            name="sourceTitle"
            value="${E(source.title || '')}"
            placeholder="Nome da fonte"
          />
          <input
            class="field"
            type="url"
            name="sourceUrl"
            value="${E(source.url || '')}"
            placeholder="https://…"
          />
          <button class="soft" type="button" data-remove-source aria-label="Remover fonte">
            ×
          </button>
        </div>`,
    )
    .join('');
}

function articleForm(article = {}) {
  return html`<form class="card newsroom-editor" data-news-article="${E(article.id || '')}">
    <div class="sectionhead">
      <div>
        <div class="eyebrow">Mesa de edição</div>
        <h2>${article.id ? 'Editar notícia' : 'Nova proposta'}</h2>
      </div>
      ${article.id ? link('/redacao', 'Fechar edição', 'soft') : ''}
    </div>
    <div class="formgrid">
      <div class="form-span-2">
        <label class="label">Título</label>
        <input
          class="field"
          name="title"
          value="${E(article.title || '')}"
          minlength="8"
          required
        />
      </div>
      <div>
        <label class="label">Categoria</label>
        <input
          class="field"
          name="category"
          value="${E(article.category || 'Atualizações')}"
          required
        />
      </div>
    </div>
    <div class="formrow">
      <label class="label">Resumo</label>
      <textarea class="textarea compact-textarea" name="summary" minlength="50" required>
${E(article.summary || '')}</textarea
      >
    </div>
    <div class="formrow">
      <label class="label">Texto da matéria</label>
      <textarea class="textarea article-textarea" name="body" minlength="240" required>
${E(article.body || '')}</textarea
      >
    </div>
    <div class="formrow">
      <div class="sectionhead compact-head">
        <div>
          <label class="label">Fontes verificáveis</label>
          <p class="small muted">São necessárias pelo menos duas fontes para enviar.</p>
        </div>
        <button class="outline" type="button" data-add-source>Adicionar fonte</button>
      </div>
      <div data-news-sources>${sourcesFields(article.sources)}</div>
    </div>
    <div class="actions">
      <button class="solid">Salvar rascunho</button>
      ${article.id
        ? html`<button class="outline" type="button" data-submit-news="${E(article.id)}">
            Enviar para certificação
          </button>`
        : ''}
    </div>
  </form>`;
}

function newsroomList(articles) {
  const active = articles.filter((article) => !article.deletedAt);
  const trashed = articles.filter((article) => article.deletedAt);
  return html`<div class="card newsroom-list">
      <div class="eyebrow">Seus textos</div>
      <h2>Rascunhos e revisões</h2>
      ${active
        .map(
          (article) =>
            html`<div class="project">
              <div class="min-width-zero">
                <h3>${E(article.title)}</h3>
                <p>${E(article.status)} · atualizado ${date(article.updatedAt)}</p>
              </div>
              <div class="actions">
                ${['draft', 'changes_requested'].includes(article.status)
                  ? link(`/redacao/${encodeURIComponent(article.id)}`, 'Editar', 'outline')
                  : ''}
                ${article.status !== 'published'
                  ? html`<button class="dangerbtn" data-trash-news="${E(article.id)}">
                      Excluir
                    </button>`
                  : link(`/noticias/${encodeURIComponent(article.slug)}`, 'Abrir', 'outline')}
              </div>
            </div>`,
        )
        .join('') || empty('Você ainda não escreveu uma notícia.')}
    </div>
    ${trashed.length
      ? html`<details class="card trash-panel">
          <summary>Lixeira da redação (${trashed.length})</summary>
          ${trashed
            .map(
              (article) =>
                html`<div class="project">
                  <div>
                    <h3>${E(article.title)}</h3>
                    <p>Excluída em ${date(article.deletedAt)}</p>
                  </div>
                  <div class="actions">
                    <button class="outline" data-restore-news="${E(article.id)}">Restaurar</button>
                    <button class="dangerbtn" data-purge-news="${E(article.id)}">
                      Excluir definitivamente
                    </button>
                  </div>
                </div>`,
            )
            .join('')}
        </details>`
      : ''}`;
}

async function redacao(articleId = '') {
  if (!state.me) {
    layout(
      html`<section class="pagehero">
        <div class="shell">
          ${empty('Entre em sua conta para participar da redação.')}
          <div class="actions center-actions">${link('/login', 'Entrar', 'solid')}</div>
        </div>
      </section>`,
    );
    return;
  }
  const [{ contributor }, { articles }] = await Promise.all([
    api('/api/news/contributor'),
    api('/api/news/mine'),
  ]);
  const approved = state.me.role === 'admin' || contributor?.status === 'approved';
  const editing = articleId ? articles.find((article) => article.id === articleId) : null;
  layout(
    html`<section class="pagehero newsroom-page">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Redactio</div>
            <h1 class="pagetitle">Redação Studiorium</h1>
            <p>Escreva com fontes. A triagem automática orienta; a certificação final é humana.</p>
          </div>
          ${link('/noticias', 'Ver notícias', 'outline')}
        </div>
        ${approved
          ? html`<div class="newsroom-grid">
              <div>${articleForm(editing || {})}</div>
              <aside>${newsroomList(articles)}</aside>
            </div>`
          : contributorApplication(contributor)}
      </div>
    </section>`,
  );
}

export { noticias, newsDetail, redacao, newsCard };

import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import { rankRelated } from '../content-intelligence.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  notFound,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

function pesquisas() {
  let q = state.query.get('q') || '';
  let area = state.query.get('area') || '';
  const areas = [...new Set(state.boot.publications.map((p) => p.area))];
  const list = state.boot.publications.filter(
    (p) =>
      (!q || JSON.stringify(p).toLowerCase().includes(q.toLowerCase())) &&
      (!area || p.area === area),
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Opera publica</div>
        <h1 class="pagetitle">Pesquisas e trabalhos</h1>
        <p>
          Explore trabalhos publicados pela comunidade, com autor, resumo, área, palavras-chave e
          licença identificados.
        </p>
        <form class="toolbar" data-research-filter>
          <input
            class="field"
            name="q"
            value="${E(q)}"
            placeholder="Tema, autor ou palavra-chave"
          /><select class="select" name="area">
            <option value="">Todas as áreas</option>
            ${areas
              .map((a) => html`<option ${a === area ? 'selected' : ''}>${E(a)}</option>`)
              .join('')}</select
          ><button class="solid">Pesquisar</button>${link(
            '/publicar',
            'Publicar trabalho',
            'outline',
          )}
        </form>
        <div class="grid grid3">
          ${list.map(publicationCard).join('') || empty('Nenhuma pesquisa encontrada.')}
        </div>
      </div>
    </section>`,
  );
}

function researchDetail(slug) {
  const p = state.boot.publications.find((x) => x.slug === slug);
  if (!p) return notFound();
  api('/api/publications/' + encodeURIComponent(p.id) + '/view', {
    method: 'POST',
    body: '{}',
  }).catch(() => {});
  const profile = state.boot.profiles.find((x) => x.userId === p.ownerId);
  const relatedPublications = rankRelated(p, state.boot.publications);
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="crumbs">${link('/pesquisas', 'Pesquisas')} / ${E(p.area)}</div>
        <article class="threadpost">
          <div class="eyebrow">${E(p.area)} · ${E(p.level)}</div>
          <h1>${E(p.title)}</h1>
          <div class="meta">
            <span
              >Autor:
              ${profile
                ? link('/autores/' + encodeURIComponent(profile.username), E(p.authorName))
                : E(p.authorName)}</span
            ><span>${date(p.createdAt)}</span><span>${num(p.views)} leituras</span
            ><span>${E(p.license)}</span>
          </div>
          <div class="rule"></div>
          <h2 class="serif">Resumo</h2>
          <p style="white-space:pre-wrap;line-height:1.8;color:#c7bdab">${E(p.abstract)}</p>
          ${p.content
            ? html`<h2 class="serif">Texto</h2>
                <p style="white-space:pre-wrap;line-height:1.85;color:#c7bdab">${E(p.content)}</p>`
            : ''}
          <div class="pills">
            ${(p.keywords || []).map((k) => html`<span class="pill">${E(k)}</span>`).join('')}
          </div>
          <div class="actions no-print" style="margin-top:25px">
            ${p.fileName
              ? html`<a class="solid" href="/api/publications/${encodeURIComponent(p.id)}/file"
                  >Baixar arquivo</a
                >`
              : ''}<button class="outline" data-print>Imprimir / salvar PDF</button
            ><button class="outline" data-report="publication:${E(p.id)}">
              Denunciar conteúdo
            </button>
          </div>
        </article>
        ${relatedPublications.length
          ? html`<section class="contextual-discovery">
              <div class="sectionhead">
                <div>
                  <div class="eyebrow">Trilha de leitura</div>
                  <h2>Pesquisas que dialogam com este trabalho</h2>
                  <p>Relação calculada por área, nível, palavras-chave, título e resumo.</p>
                </div>
              </div>
              <div class="grid grid3">${relatedPublications.map(publicationCard).join('')}</div>
            </section>`
          : ''}
      </div>
    </section>`,
  );
}

function autores() {
  const profiles = state.boot.profiles;
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Auctores</div>
        <h1 class="pagetitle">Autores</h1>
        <p>
          Perfis públicos de estudantes, professores, pesquisadores, criadores e instituições que
          compartilham conhecimento no Studiorium.
        </p>
        <div class="grid grid3" style="margin-top:28px">
          ${profiles
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
            .join('') || empty('Nenhum autor público ainda.')}
        </div>
      </div>
    </section>`,
  );
}

function authorDetail(username) {
  const p = state.boot.profiles.find((x) => x.username === username);
  if (!p) return notFound();
  const pubs = state.boot.publications.filter(
    (x) => x.ownerId === p.userId || x.authorName === p.displayName,
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="profilehero">
          <div class="avatar">${E(initials(p.displayName))}</div>
          <div>
            <div class="eyebrow">${E(p.profileType)}</div>
            <h1 class="pagetitle">${E(p.displayName)}</h1>
            <p>${E(p.bio || 'Membro da comunidade Studiorium.')}</p>
            <span class="badge">@${E(p.username)}</span>
          </div>
        </div>
        <div class="section compact">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Publicações</div>
              <h2>Obras deste autor</h2>
            </div>
          </div>
          <div class="grid grid3">
            ${pubs.map(publicationCard).join('') ||
            empty('Este autor ainda não possui publicações públicas.')}
          </div>
        </div>
      </div>
    </section>`,
  );
}

export { pesquisas, researchDetail, autores, authorDetail };

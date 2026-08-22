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
          ${p.coverName
            ? html`<img
                class="research-cover"
                src="/api/publications/${encodeURIComponent(p.id)}/cover"
                alt="Foto de apresentação de ${E(p.title)}"
              />`
            : ''}
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
            ><button class="outline" data-report="publication:${E(p.id)}">Denunciar conteúdo</button
            ><button class="soft" type="button" data-publication-boost="${E(p.id)}">
              Impulsionar · <span data-boost-count="${E(p.id)}">${num(p.boosts)}</span>
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

function publicProjectDetail(projectId) {
  const project = (state.boot.communityProjects || []).find((item) => item.id === projectId);
  if (!project) return notFound();
  const profile = state.boot.profiles.find((item) => item.userId === project.ownerId);
  layout(
    html`<section class="pagehero">
      <div class="shell article-width">
        <div class="eyebrow">${E(project.type)}</div>
        <h1 class="pagetitle">${E(project.title)}</h1>
        <p>
          Compartilhado por
          ${profile
            ? link('/autores/' + encodeURIComponent(profile.username), E(profile.displayName))
            : 'membro do Studiorium'}
          · atualizado ${date(project.updatedAt)}
        </p>
        <article class="paper public-project">
          ${(project.sections || [])
            .map(
              (section) =>
                html`<section>
                  <h2>${E(section.name)}</h2>
                  <p style="white-space:pre-wrap">
                    ${E(section.content || 'Seção ainda não preenchida.')}
                  </p>
                </section>`,
            )
            .join('')}
        </article>
      </div>
    </section>`,
  );
}

export { researchDetail, publicProjectDetail };

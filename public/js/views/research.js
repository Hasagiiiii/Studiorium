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
            ><button class="outline" data-report="publication:${E(p.id)}">
              Denunciar conteúdo
            </button><button class="soft" type="button" data-publication-boost="${E(p.id)}">
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

function autores() {
  const q = (state.query.get('q') || '').trim().toLocaleLowerCase('pt-BR');
  const type = state.query.get('tipo') || '';
  const types = [...new Set(state.boot.profiles.map((profile) => profile.profileType))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const profiles = state.boot.profiles.filter(
    (profile) =>
      (!q || JSON.stringify(profile).toLocaleLowerCase('pt-BR').includes(q)) &&
      (!type || profile.profileType === type),
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Auctores</div>
        <h1 class="pagetitle">Autores</h1>
        <p>
          Perfis públicos de estudantes, professores, pesquisadores, criadores e instituições que
          compartilham conhecimento no Studiorium.
        </p>
        <form class="toolbar author-search" data-author-filter>
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
                (item) => html`<option value="${E(item)}" ${item === type ? 'selected' : ''}>
                  ${E(item)}
                </option>`,
              )
              .join('')}
          </select>
          <button class="solid">Pesquisar usuários</button>
        </form>
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
                  <div class="pills">
                    <span class="pill">${E(p.profileType)}</span>
                    ${p.verificationStatus === 'verified'
                      ? html`<span class="verified-badge">✓ ${E(
                          p.verifiedSpecialty || 'Especialista verificado',
                        )}</span>`
                      : ''}
                  </div>
                  ${p.course
                    ? html`<p class="profile-course">${E(p.course)}${
                        p.institution ? ` · ${E(p.institution)}` : ''
                      }</p>`
                    : ''}
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
  const projects = (state.boot.communityProjects || []).filter((x) => x.ownerId === p.userId);
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="profilehero">
          <div class="avatar">${E(initials(p.displayName))}</div>
          <div>
            <div class="eyebrow">${E(p.profileType)}</div>
            <h1 class="pagetitle">${E(p.displayName)}</h1>
            ${p.verificationStatus === 'verified'
              ? html`<span class="verified-badge large">✓ Especialista verificado · ${E(
                  p.verifiedSpecialty || p.course,
                )}</span>`
              : ''}
            ${p.contributionStatus === 'active_collaborator'
              ? '<span class="badge collaborator">Colaborador ativo</span>'
              : ''}
            <p>${E(p.bio || 'Membro da comunidade Studiorium.')}</p>
            ${p.course || p.institution
              ? html`<p class="profile-credentials">
                  ${E(p.course || p.educationLevel)}${p.institution
                    ? ` · ${E(p.institution)}`
                    : ''}
                </p>`
              : ''}
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
        <div class="section compact">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Projetos</div>
              <h2>Projetos públicos deste autor</h2>
            </div>
          </div>
          <div class="grid grid3">
            ${projects.map(projectCard).join('') || empty('Este autor ainda não compartilhou projetos.')}
          </div>
        </div>
      </div>
    </section>`,
  );
}

function projectCard(project) {
  const profile = state.boot.profiles.find((item) => item.userId === project.ownerId);
  const excerpt = (project.sections || []).find((section) => section.content)?.content || '';
  return html`<article class="card hover">
    <div class="eyebrow">${E(project.type)}</div>
    <h3>${link('/projetos/' + encodeURIComponent(project.id), E(project.title))}</h3>
    <p>${E(excerpt.slice(0, 220) || 'Projeto acadêmico compartilhado pela comunidade.')}</p>
    <div class="meta">
      <span>${E(profile?.displayName || 'Membro do Studiorium')}</span
      ><span>Atualizado ${date(project.updatedAt)}</span>
    </div>
  </article>`;
}

function projetos() {
  const q = (state.query.get('q') || '').trim().toLocaleLowerCase('pt-BR');
  const projects = (state.boot.communityProjects || []).filter(
    (project) => !q || JSON.stringify(project).toLocaleLowerCase('pt-BR').includes(q),
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Opera communitatis</div>
        <h1 class="pagetitle">Projetos da comunidade</h1>
        <p>Explore projetos acadêmicos que seus autores escolheram compartilhar publicamente.</p>
        <form class="toolbar" data-project-filter>
          <input class="field" type="search" name="q" value="${E(
            state.query.get('q') || '',
          )}" placeholder="Pesquisar projeto, tipo ou conteúdo" />
          <button class="solid">Pesquisar projetos</button>
        </form>
        <div class="grid grid3" style="margin-top:28px">
          ${projects.map(projectCard).join('') || empty('Nenhum projeto público encontrado.')}
        </div>
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
              (section) => html`<section>
                <h2>${E(section.name)}</h2>
                <p style="white-space:pre-wrap">${E(section.content || 'Seção ainda não preenchida.')}</p>
              </section>`,
            )
            .join('')}
        </article>
      </div>
    </section>`,
  );
}

export { pesquisas, researchDetail, projetos, publicProjectDetail, autores, authorDetail };

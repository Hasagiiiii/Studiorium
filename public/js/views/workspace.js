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

async function escrivaninha() {
  if (!state.me) return requireLogin();
  let me;
  try {
    me = await api('/api/me');
  } catch (e) {
    return requireLogin();
  }
  const projects = me.projects.filter((project) => !project.deletedAt);
  const projectTrash = me.projects.filter((project) => project.deletedAt);
  const codeProjects = (me.codeProjects || []).filter((project) => !project.deletedAt);
  const codeTrash = (me.codeProjects || []).filter((project) => project.deletedAt);
  const techResources = me.techResources || [];
  const pending =
    me.publications.filter((item) => item.status === 'pending_review').length +
    techResources.filter((item) => item.status === 'pending_review').length;
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Scriptorium personale</div>
            <h1 class="pagetitle">Escrivaninha de ${E(state.me.displayName.split(' ')[0])}</h1>
          </div>
          <div class="actions"><button class="outline" data-logout>Sair</button></div>
        </div>
        <div class="stats">
          <div class="stat"><strong>${projects.length}</strong><span>Projetos</span></div>
          <div class="stat"><strong>${me.publications.length}</strong><span>Publicações</span></div>
          <div class="stat"><strong>${pending}</strong><span>Em revisão</span></div>
          <div class="stat">
            <strong>${state.me.isMinor ? 'Privado' : 'Público'}</strong><span>Perfil</span>
          </div>
        </div>
        <div class="actions" style="margin-bottom:25px">
          ${link('/acervo', 'Novo a partir de modelo', 'solid')}${link(
            '/publicar',
            'Publicar trabalho',
            'outline',
          )}${link('/atelie', 'Criar banner', 'outline')}${link(
            '/laboratorio',
            'Laboratório de Código',
            'outline',
          )}${link('/oficina', 'Tech & Oficina', 'outline')}${link(
            '/redacao',
            'Redação',
            'outline',
          )}${link('/estudio-templates', 'Estúdio de templates', 'outline')}${state.me.role ===
          'admin'
            ? link('/admin', 'Painel ADM', 'dangerbtn')
            : ''}
        </div>
        <div class="grid grid2">
          <div class="card">
            <div class="eyebrow">Projetos</div>
            <h3>Em sua mesa</h3>
            ${projects
              .map(
                (p) =>
                  html`<div class="project">
                    <div>
                      <h3>${E(p.title)}</h3>
                      <p>${E(p.type)} · atualizado ${date(p.updatedAt)}</p>
                    </div>
                    <div class="actions">
                      ${link('/editor/' + encodeURIComponent(p.id), 'Editar', 'outline')}<button
                        class="dangerbtn"
                        data-delete-project="${E(p.id)}"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>`,
              )
              .join('') || empty('Você ainda não iniciou um projeto.')}
          </div>
          <div class="card">
            <div class="eyebrow">Publicações</div>
            <h3>Seu arquivo público</h3>
            ${me.publications
              .map(
                (p) =>
                  html`<div class="project">
                    <div>
                      <h3>${E(p.title)}</h3>
                      <p>Status: ${E(p.status)} · ${date(p.createdAt)}</p>
                    </div>
                    ${p.status === 'published'
                      ? link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir', 'outline')
                      : ''}
                  </div>`,
              )
              .join('') || empty('Você ainda não enviou trabalhos para publicação.')}
          </div>
        </div>
        <div class="card" style="margin-top:18px">
          <div class="eyebrow">Oficina e tecnologia</div>
          <h3>Seus tutoriais e projetos enviados</h3>
          ${techResources
            .map(
              (item) =>
                html`<div class="project">
                  <div>
                    <h3>${E(item.title)}</h3>
                    <p>${E(item.hub)} · Status: ${E(item.status)} · ${date(item.createdAt)}</p>
                  </div>
                  ${item.status === 'published' ? link('/oficina', 'Ver publicado', 'outline') : ''}
                </div>`,
            )
            .join('') || empty('Você ainda não enviou conteúdo para a Oficina.')}
          <div class="actions" style="margin-top:14px">
            ${link('/oficina?novo=1', 'Enviar conteúdo', 'solid')}
          </div>
        </div>
        <div class="card" style="margin-top:18px">
          <div class="eyebrow">Projetos de código</div>
          <h3>Studiorium Lab</h3>
          ${codeProjects
            .map(
              (p) =>
                html`<div class="project">
                  <div>
                    <h3>${E(p.title)}</h3>
                    <p>${E(p.visibility)} · atualizado ${date(p.updatedAt)}</p>
                  </div>
                  <div class="actions">
                    ${link('/laboratorio/' + encodeURIComponent(p.id), 'Codar', 'outline')}
                    <button class="dangerbtn" data-delete-code-project="${E(p.id)}">Excluir</button>
                  </div>
                </div>`,
            )
            .join('') || empty('Você ainda não criou projetos de código.')}
          <div class="actions" style="margin-top:14px">
            ${link('/laboratorio', 'Criar projeto de código', 'solid')}
          </div>
        </div>
        ${projectTrash.length || codeTrash.length
          ? html`<details class="card trash-panel space-top">
              <summary>Lixeira (${projectTrash.length + codeTrash.length})</summary>
              <p class="muted small">
                Restaure itens ou exclua definitivamente para liberar a lista.
              </p>
              ${projectTrash
                .map(
                  (project) =>
                    html`<div class="project">
                      <div>
                        <h3>${E(project.title)}</h3>
                        <p>Documento · ${date(project.deletedAt)}</p>
                      </div>
                      <div class="actions">
                        <button class="outline" data-restore-project="${E(project.id)}">
                          Restaurar
                        </button>
                        <button class="dangerbtn" data-purge-project="${E(project.id)}">
                          Excluir definitivamente
                        </button>
                      </div>
                    </div>`,
                )
                .join('')}
              ${codeTrash
                .map(
                  (project) =>
                    html`<div class="project">
                      <div>
                        <h3>${E(project.title)}</h3>
                        <p>Código · ${date(project.deletedAt)}</p>
                      </div>
                      <div class="actions">
                        <button class="outline" data-restore-code-project="${E(project.id)}">
                          Restaurar
                        </button>
                        <button class="dangerbtn" data-purge-code-project="${E(project.id)}">
                          Excluir definitivamente
                        </button>
                      </div>
                    </div>`,
                )
                .join('')}
            </details>`
          : ''}
        <div class="card" style="margin-top:18px">
          <div class="eyebrow">Perfil</div>
          <h3>Identidade acadêmica</h3>
          <form data-profile>
            <div class="formgrid">
              <div>
                <label class="label">Nome de exibição</label
                ><input class="field" name="displayName" value="${E(state.me.displayName)}" />
              </div>
              <div>
                <label class="label">Tipo de perfil</label
                ><select class="select" name="profileType">
                  ${[
                    'estudante',
                    'universitario',
                    'professor',
                    'pesquisador',
                    'designer',
                    'instituicao',
                    'criador',
                    'jornalista',
                    'comunicador',
                  ]
                    .map(
                      (x) =>
                        html`<option ${x === state.me.profileType ? 'selected' : ''}>${x}</option>`,
                    )
                    .join('')}
                </select>
              </div>
            </div>
            <div class="formrow" style="margin-top:16px">
              <label class="label">Biografia</label
              ><textarea class="textarea" name="bio">${E(state.me.bio || '')}</textarea>
            </div>
            ${!state.me.isMinor
              ? html`<label class="small"
                  ><input type="checkbox" name="isPublic" ${state.me.isPublic ? 'checked' : ''} />
                  Manter meu perfil público</label
                >`
              : html`<div class="notice">
                  Por segurança, perfis de menores permanecem privados nesta edição online.
                </div>`}
            <div class="actions" style="margin-top:15px">
              <button class="solid">Salvar perfil</button>
            </div>
          </form>
        </div>
        <div class="card" style="margin-top:18px">
          <div class="eyebrow">Segurança</div>
          <h3>Alterar senha</h3>
          <p>
            Use uma senha exclusiva com pelo menos 12 caracteres. Ao trocar a senha, outras sessões
            abertas serão encerradas.
          </p>
          <form data-change-password>
            <div class="formgrid">
              <div>
                <label class="label">Senha atual</label
                ><input
                  class="field"
                  type="password"
                  name="currentPassword"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div>
                <label class="label">Nova senha</label
                ><input
                  class="field"
                  type="password"
                  name="newPassword"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="128"
                  required
                />
              </div>
            </div>
            <div class="actions" style="margin-top:15px">
              <button class="solid">Trocar senha</button>
            </div>
          </form>
        </div>
      </div>
    </section>`,
  );
}

async function editor(id) {
  if (!state.me) return requireLogin();
  let d;
  try {
    d = await api('/api/projects/' + encodeURIComponent(id));
  } catch (e) {
    toast(e.message, true);
    return goto('/escrivaninha');
  }
  const p = d.project;
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Editor</div>
            <h1 class="pagetitle">${E(p.title)}</h1>
          </div>
          <div class="actions no-print">
            ${link('/escrivaninha', 'Voltar', 'outline')}<button
              class="solid"
              data-save-project="${E(p.id)}"
            >
              Salvar</button
            ><button class="outline" data-print>Imprimir / PDF</button>
          </div>
        </div>
        <div class="editorwrap">
          <aside class="sidepanel">
            <h3>Estrutura</h3>
            ${p.sections
              .map(
                (s, i) =>
                  html`<button
                    class="sectionbtn ${i === 0 ? 'active' : ''}"
                    data-scroll-section="sec${i}"
                  >
                    ${E(s.name)}
                  </button>`,
              )
              .join('')}
          </aside>
          <div>
            <div class="paper" data-project-form data-project-id="${E(p.id)}">
              <input class="doctitle" name="title" value="${E(p.title)}" />${p.sections
                .map(
                  (s, i) =>
                    html`<section id="sec${i}" data-doc-section>
                      <h2><input name="sectionName" value="${E(s.name)}" /></h2>
                      <textarea
                        name="sectionContent"
                        placeholder="Escreva ${E(s.name.toLowerCase())}…"
                      >
${E(s.content)}</textarea
                      >
                    </section>`,
                )
                .join('')}
            </div>
          </div>
          <aside class="sidepanel">
            <h3>Notas privadas</h3>
            <textarea
              class="textarea"
              data-project-notes
              placeholder="Referências, lembretes e orientações…"
            >
${E(p.notes || '')}</textarea
            >
            <div class="notice" style="margin-top:15px">
              O editor salva texto estruturado. Use “Imprimir / PDF” para gerar uma versão pronta
              pelo navegador.
            </div>
          </aside>
        </div>
      </div>
    </section>`,
  );
}

function publicar() {
  if (!state.me) return requireLogin();
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Editio</div>
        <h1 class="pagetitle">Publicar trabalho</h1>
        <p>
          Envie um trabalho para a Biblioteca pública. O título, resumo, área, palavras-chave e
          licença ficarão visíveis quando a publicação for aprovada.
        </p>
        <div class="grid grid2" style="margin-top:25px">
          <form class="card" data-publication>
            <div class="formrow">
              <label class="label">Título</label
              ><input class="field" name="title" required minlength="6" />
            </div>
            <div class="formgrid">
              <div>
                <label class="label">Área</label
                ><input class="field" name="area" placeholder="Ex.: Educação" />
              </div>
              <div>
                <label class="label">Nível</label
                ><select class="select" name="level">
                  <option>Ensino fundamental</option>
                  <option>Ensino médio</option>
                  <option>Graduação</option>
                  <option>Pós-graduação</option>
                  <option>Pesquisa independente</option>
                </select>
              </div>
            </div>
            <div class="formrow" style="margin-top:16px">
              <label class="label">Resumo</label
              ><textarea
                class="textarea"
                name="abstract"
                minlength="40"
                required
                placeholder="Apresente objetivo, método e principais resultados…"
              ></textarea>
            </div>
            <div class="formrow">
              <label class="label">Texto do trabalho (opcional)</label
              ><textarea
                class="textarea"
                name="content"
                placeholder="Você pode colar o conteúdo principal aqui."
              ></textarea>
            </div>
            <div class="formrow">
              <label class="label">Arquivo do trabalho (opcional)</label
              ><input
                class="field"
                data-publication-file
                type="file"
                accept=".pdf,.docx,.pptx,.odt,.txt"
              />
              <p class="small muted">
                PDF, DOCX, PPTX, ODT ou TXT, até 5 MB. O arquivo só fica público depois da
                aprovação.
              </p>
            </div>
            <div class="formrow">
              <label class="label">Palavras-chave</label
              ><input
                class="field"
                name="keywords"
                placeholder="educação, matemática, tecnologia"
              />
            </div>
            <div class="formrow">
              <label class="label">Licença</label
              ><select class="select" name="license">
                <option>Todos os direitos reservados</option>
                <option>CC BY 4.0</option>
                <option>CC BY-NC 4.0</option>
                <option>CC BY-SA 4.0</option>
              </select>
            </div>
            <button class="solid">Enviar para publicação</button>
          </form>
          <div>
            <div class="card">
              <div class="eyebrow">Antes de publicar</div>
              <h3>Autoria e segurança</h3>
              <p>
                Publique apenas material de sua autoria ou que você tenha permissão para
                compartilhar. Cite fontes, evite dados pessoais desnecessários e não exponha
                crianças ou adolescentes.
              </p>
              <div class="notice">
                Publicações de usuários comuns entram em <strong>revisão</strong>. A conta de
                curadoria pode aprovar ou rejeitar pelo painel de moderação.
              </div>
            </div>
            <div class="card" style="margin-top:18px">
              <h3>Comunidade protegida</h3>
              <p>
                Racismo, xenofobia, sexismo, assédio, bullying, exploração sexual, divulgação
                indevida de dados pessoais, golpes e conteúdo que coloque menores em risco são
                proibidos.
              </p>
              ${link('/diretrizes', 'Ler diretrizes completas', 'outline')}
            </div>
          </div>
        </div>
      </div>
    </section>`,
  );
}

export { escrivaninha, editor, publicar };

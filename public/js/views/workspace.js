import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  requireLogin,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

function submissionStatus(status) {
  const labels = {
    published: 'Publicado',
    pending_review: 'Em revisão',
    rejected: 'Rejeitado',
    hidden: 'Oculto',
  };
  return labels[status] || status;
}

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
  const bookSaves = me.bookSaves || [];
  const bookshelf = bookSaves
    .map((saved) => ({
      ...saved,
      book: (state.boot.books || []).find((book) => book.id === saved.bookId),
    }))
    .filter((saved) => saved.book);
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
          <div class="stat"><strong>${bookshelf.length}</strong><span>Livros na estante</span></div>
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
          )}${link('/estudio-templates', 'Estúdio de templates', 'outline')}${[
            'moderator',
            'curator',
            'editor',
            'admin',
          ].includes(state.me.role)
            ? link('/moderacao', 'Moderação', 'outline')
            : ''}${state.me.role === 'admin' ? link('/admin', 'Painel ADM', 'dangerbtn') : ''}
        </div>
        <div class="card personal-shelf" style="margin-bottom:18px">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Armarium personale</div>
              <h3>Minha estante de livros</h3>
            </div>
            ${link('/biblioteca?tipo=livros', 'Explorar livros →', 'linkbtn')}
          </div>
          <div class="mini-shelf">
            ${bookshelf
              .map(
                ({ book, shelfStatus }) =>
                  html`<article class="mini-book theme-${E(book.coverTheme)}">
                    <span>${E(book.category)}</span><strong>${E(book.title)}</strong
                    ><small>${E(book.author)} · ${E(shelfStatus)}</small>
                    <button class="soft" type="button" data-book-remove="${E(book.id)}">
                      Remover
                    </button>
                  </article>`,
              )
              .join('') || empty('Sua estante está vazia. Guarde livros pela Biblioteca.')}
          </div>
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
                      <p>
                        ${E(p.type)} · ${p.visibility === 'public' ? 'público' : 'privado'} ·
                        atualizado ${date(p.updatedAt)}
                      </p>
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
                      <p>Status: ${E(submissionStatus(p.status))} · ${date(p.createdAt)}</p>
                    </div>
                    <div class="actions">
                      ${p.status === 'published'
                        ? link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir', 'outline')
                        : html`${link(
                              '/publicar?editar=' + encodeURIComponent(p.id),
                              'Editar e reenviar',
                              'outline',
                            )}<button class="dangerbtn" data-delete-publication="${E(p.id)}">
                              Apagar definitivamente
                            </button>`}
                    </div>
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
                    <p>
                      ${E(item.hub)} · Status: ${E(submissionStatus(item.status))} ·
                      ${date(item.createdAt)}
                    </p>
                  </div>
                  <div class="actions">
                    ${item.status === 'published'
                      ? link(
                          '/oficina/' + encodeURIComponent(item.slug),
                          'Ver publicado',
                          'outline',
                        )
                      : html`${link(
                            '/oficina?editar=' + encodeURIComponent(item.id),
                            'Editar e reenviar',
                            'outline',
                          )}<button class="dangerbtn" data-delete-tech-resource="${E(item.id)}">
                            Apagar definitivamente
                          </button>`}
                  </div>
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
                    'monitor',
                    'tecnico',
                    'profissional',
                    'autodidata',
                    'internauta',
                  ]
                    .map(
                      (x) =>
                        html`<option ${x === state.me.profileType ? 'selected' : ''}>${x}</option>`,
                    )
                    .join('')}
                </select>
              </div>
            </div>
            <div class="formgrid">
              <div>
                <label class="label">Curso ou área de formação</label>
                <input
                  class="field"
                  name="course"
                  value="${E(state.me.course || '')}"
                  placeholder="Ex.: Farmácia, Matemática, Técnico em Informática"
                />
              </div>
              <div>
                <label class="label">Instituição</label>
                <input
                  class="field"
                  name="institution"
                  value="${E(state.me.institution || '')}"
                  placeholder="Escola, faculdade ou instituição"
                />
              </div>
            </div>
            <div class="formrow">
              <label class="label">Nível de formação</label>
              <select class="select" name="educationLevel">
                ${[
                  '',
                  'Ensino fundamental',
                  'Ensino médio',
                  'Curso técnico',
                  'Graduação em andamento',
                  'Graduação concluída',
                  'Pós-graduação',
                  'Mestrado',
                  'Doutorado',
                  'Autodidata',
                ]
                  .map(
                    (level) =>
                      html`<option
                        value="${E(level)}"
                        ${level === state.me.educationLevel ? 'selected' : ''}
                      >
                        ${E(level || 'Não informar')}
                      </option>`,
                  )
                  .join('')}
              </select>
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
        <div class="card verification-card" style="margin-top:18px">
          <div class="eyebrow">Fides academica</div>
          <h3>Verificação de especialista</h3>
          ${state.me.verificationStatus === 'verified'
            ? html`<div class="verified-banner">
                <span class="verified-seal">✓</span>
                <div>
                  <strong>Especialista verificado</strong>
                  <p>${E(state.me.verifiedSpecialty || state.me.course || 'Área confirmada')}</p>
                </div>
              </div>`
            : state.me.verificationStatus === 'pending'
              ? html`<div class="notice">
                  Sua solicitação está em análise. A decisão aparecerá na central de notificações.
                </div>`
              : state.me.isMinor
                ? html`<div class="notice">
                    A verificação profissional fica disponível quando a conta atingir a maioridade.
                  </div>`
                : html`<p>
                      Envie sua formação e uma referência verificável. O selo só aparece depois da
                      análise de um administrador.
                    </p>
                    <form data-profile-verification>
                      <div class="formgrid">
                        <div>
                          <label class="label">Curso ou formação</label>
                          <input
                            class="field"
                            name="course"
                            value="${E(state.me.course || '')}"
                            required
                          />
                        </div>
                        <div>
                          <label class="label">Instituição</label>
                          <input
                            class="field"
                            name="institution"
                            value="${E(state.me.institution || '')}"
                            required
                          />
                        </div>
                      </div>
                      <div class="formgrid">
                        <div>
                          <label class="label">Nível de formação</label>
                          <input
                            class="field"
                            name="educationLevel"
                            value="${E(state.me.educationLevel || '')}"
                            required
                          />
                        </div>
                        <div>
                          <label class="label">Especialidade para o selo</label>
                          <input class="field" name="specialty" required />
                        </div>
                      </div>
                      <div class="formrow">
                        <label class="label">Referência de comprovação (opcional)</label>
                        <input
                          class="field"
                          name="credentialReference"
                          type="url"
                          placeholder="Link institucional, currículo ou registro profissional"
                        />
                      </div>
                      <div class="formrow">
                        <label class="label">Explique sua formação e experiência</label>
                        <textarea
                          class="textarea"
                          name="statement"
                          minlength="30"
                          required
                        ></textarea>
                      </div>
                      <button class="solid">Solicitar verificação</button>
                    </form>`}
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
            <label class="label" style="margin-top:15px">Compartilhamento</label>
            <select class="select" data-project-visibility>
              <option value="private" ${p.visibility !== 'public' ? 'selected' : ''}>
                Privado — somente eu
              </option>
              <option value="public" ${p.visibility === 'public' ? 'selected' : ''}>
                Público — aparece no meu perfil
              </option>
            </select>
            <div class="notice" style="margin-top:15px">
              As notas nunca são exibidas no perfil. Use “Imprimir / PDF” para gerar uma versão
              pronta pelo navegador.
            </div>
          </aside>
        </div>
      </div>
    </section>`,
  );
}

function selected(value, current) {
  return value === current ? 'selected' : '';
}

async function publicar() {
  if (!state.me) return requireLogin();
  const publicationId = state.query.get('editar') || '';
  let publication = {};

  if (publicationId) {
    const result = await api(`/api/publications/${encodeURIComponent(publicationId)}`);
    publication = result.publication;
  }

  const editing = Boolean(publication.id);
  const keywords = Array.isArray(publication.keywords)
    ? publication.keywords.join(', ')
    : publication.keywords || '';
  const introText = editing
    ? 'Atualize o material e reenvie-o para uma nova revisão.'
    : 'Envie um trabalho para a Biblioteca pública. O título, resumo, área, ' +
      'palavras-chave e licença ficarão visíveis quando a publicação for aprovada.';
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Editio</div>
        <h1 class="pagetitle">${editing ? 'Editar trabalho enviado' : 'Publicar trabalho'}</h1>
        <p>${E(introText)}</p>
        <div class="grid grid2" style="margin-top:25px">
          <form class="card" data-publication="${E(publication.id || '')}">
            ${editing
              ? html`<div class="notice">
                  Este formulário contém o que já foi enviado. Ao salvar, o trabalho volta para a
                  fila de revisão.
                </div>`
              : ''}
            <div class="formrow">
              <label class="label">Título</label
              ><input
                class="field"
                name="title"
                value="${E(publication.title || '')}"
                required
                minlength="6"
              />
            </div>
            <div class="formgrid">
              <div>
                <label class="label">Área</label
                ><input
                  class="field"
                  name="area"
                  value="${E(publication.area || '')}"
                  placeholder="Ex.: Educação"
                />
              </div>
              <div>
                <label class="label">Nível</label
                ><select class="select" name="level">
                  <option ${selected('Ensino fundamental', publication.level)}>
                    Ensino fundamental
                  </option>
                  <option ${selected('Ensino médio', publication.level)}>Ensino médio</option>
                  <option ${selected('Graduação', publication.level)}>Graduação</option>
                  <option ${selected('Pós-graduação', publication.level)}>Pós-graduação</option>
                  <option ${selected('Pesquisa independente', publication.level)}>
                    Pesquisa independente
                  </option>
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
              >
${E(publication.abstract || '')}</textarea
              >
            </div>
            <div class="formrow">
              <label class="label">Texto do trabalho (opcional)</label
              ><textarea
                class="textarea"
                name="content"
                placeholder="Você pode colar o conteúdo principal aqui."
              >
${E(publication.content || '')}</textarea
              >
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
                ${publication.fileName
                  ? `Arquivo atual: ${E(publication.fileName)}. Escolha outro somente se quiser substituí-lo.`
                  : 'PDF, DOCX, PPTX, ODT ou TXT, até 5 MB.'}
                O arquivo só fica público depois da aprovação.
              </p>
            </div>
            <div class="formrow">
              <label class="label">Foto de apresentação (opcional)</label>
              <input
                class="field"
                data-publication-cover
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
              <p class="small muted">
                ${publication.coverName
                  ? `Foto atual: ${E(publication.coverName)}. Escolha outra somente para substituir.`
                  : 'JPG, PNG ou WebP, até 3 MB.'}
                Se você não enviar foto, o trabalho continua com o cartão clássico do Studiorium.
              </p>
            </div>
            <div class="formrow">
              <label class="label">Palavras-chave</label
              ><input
                class="field"
                name="keywords"
                value="${E(keywords)}"
                placeholder="educação, matemática, tecnologia"
              />
            </div>
            <div class="formrow">
              <label class="label">Licença</label
              ><select class="select" name="license">
                <option ${selected('Todos os direitos reservados', publication.license)}>
                  Todos os direitos reservados
                </option>
                <option ${selected('CC BY 4.0', publication.license)}>CC BY 4.0</option>
                <option ${selected('CC BY-NC 4.0', publication.license)}>CC BY-NC 4.0</option>
                <option ${selected('CC BY-SA 4.0', publication.license)}>CC BY-SA 4.0</option>
              </select>
            </div>
            <div class="actions">
              <button class="solid">
                ${editing ? 'Salvar e reenviar' : 'Enviar para publicação'}
              </button>
              ${editing ? link('/escrivaninha', 'Cancelar', 'outline') : ''}
            </div>
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

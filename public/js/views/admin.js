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

function adminTabs(active) {
  if (state.me?.role !== 'admin') {
    return html`<div class="admin-tabs">
      ${link('/moderacao', 'Fila de moderação', `admin-tab ${active === 'moderacao' ? 'active' : ''}`)}
    </div>`;
  }
  const tabs = [
    ['overview', '/admin', 'Visão geral'],
    ['moderacao', '/admin/moderacao', 'Moderação'],
    ['usuarios', '/admin/usuarios', 'Usuários'],
    ['verificacoes', '/admin/verificacoes', 'Verificações'],
    ['publicacoes', '/admin/publicacoes', 'Publicações'],
    ['oficina', '/admin/oficina', 'Oficina'],
    ['coloquio', '/admin/coloquio', 'Colóquio'],
    ['acervo', '/admin/acervo', 'Acervo'],
    ['noticias', '/admin/noticias', 'Notícias'],
    ['configuracoes', '/admin/configuracoes', 'Configurações'],
    ['registro', '/admin/registro', 'Registro'],
  ];
  return html`<div class="admin-tabs">
    ${tabs
      .map(([id, path, label]) => link(path, label, `admin-tab ${active === id ? 'active' : ''}`))
      .join('')}
  </div>`;
}

function adminStatus(status) {
  const labels = {
    active: 'Ativo',
    suspended: 'Suspenso',
    published: 'Publicado',
    pending_review: 'Em revisão',
    rejected: 'Rejeitado',
    hidden: 'Oculto',
    open: 'Aberta',
    reviewing: 'Em análise',
    resolved: 'Resolvida',
    dismissed: 'Descartada',
    admin: 'ADM',
    user: 'Usuário',
    moderator: 'Moderador',
    curator: 'Curador',
    editor: 'Editor',
    pending: 'Pendente',
    approved: 'Aprovada',
  };
  return html`<span class="badge status-${E(status)}">${E(labels[status] || status)}</span>`;
}

function adminShell(tab, title, subtitle, content) {
  layout(
    html`<section class="pagehero admin-page">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Administratio Studiorum</div>
            <h1 class="pagetitle">${E(title)}</h1>
            <p>${E(subtitle)}</p>
          </div>
          ${link('/escrivaninha', 'Voltar à escrivaninha', 'outline')}
        </div>
        ${adminTabs(tab)}${content}
      </div>
    </section>`,
  );
}

function adminFilter(items, fields) {
  const q = (state.query.get('q') || '').trim().toLocaleLowerCase('pt-BR');
  if (!q) return items;
  return items.filter((item) =>
    fields.some((f) =>
      String(item[f] || '')
        .toLocaleLowerCase('pt-BR')
        .includes(q),
    ),
  );
}

function adminSearch(label = 'Pesquisar') {
  return html`<form class="admin-search" data-admin-search>
    <input
      class="field"
      name="q"
      value="${E(state.query.get('q') || '')}"
      placeholder="${E(label)}"
    /><button class="outline">Pesquisar</button>${state.query.get('q')
      ? link(location.pathname, 'Limpar', 'soft')
      : ''}
  </form>`;
}

function adminPublicationEditor(publication) {
  const keywords = Array.isArray(publication.keywords)
    ? publication.keywords.join(', ')
    : publication.keywords || '';

  return html`<details class="review-details admin-content-editor">
    <summary>Editar conteúdo enviado</summary>
    <form class="admin-edit-form" data-admin-edit-content="publication:${E(publication.id)}">
      <div class="formgrid">
        <div class="form-span-2">
          <label class="label">Título</label>
          <input class="field" name="title" value="${E(publication.title)}" required />
        </div>
        <div>
          <label class="label">Área</label>
          <input class="field" name="area" value="${E(publication.area)}" />
        </div>
        <div>
          <label class="label">Nível</label>
          <input class="field" name="level" value="${E(publication.level)}" />
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="abstract" minlength="40" required>
${E(publication.abstract || '')}</textarea
        >
      </div>
      <div class="formrow">
        <label class="label">Texto completo</label>
        <textarea class="textarea article-textarea" name="content">
${E(publication.content || '')}</textarea
        >
      </div>
      <div class="formgrid">
        <div>
          <label class="label">Palavras-chave</label>
          <input class="field" name="keywords" value="${E(keywords)}" />
        </div>
        <div>
          <label class="label">Licença</label>
          <input class="field" name="license" value="${E(publication.license)}" />
        </div>
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

function adminTechEditor(resource) {
  const tags = Array.isArray(resource.tags) ? resource.tags.join(', ') : resource.tags || '';

  return html`<details class="review-details admin-content-editor">
    <summary>Editar conteúdo enviado</summary>
    <form class="admin-edit-form" data-admin-edit-content="tech_resource:${E(resource.id)}">
      <div class="formgrid">
        <div class="form-span-2">
          <label class="label">Título</label>
          <input class="field" name="title" value="${E(resource.title)}" required />
        </div>
        <div>
          <label class="label">Área</label>
          <input class="field" name="hub" value="${E(resource.hub)}" />
        </div>
        <div>
          <label class="label">Tipo</label>
          <input class="field" name="category" value="${E(resource.category)}" />
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="summary" required>${E(resource.summary || '')}</textarea>
      </div>
      <div class="formrow">
        <label class="label">Conteúdo completo</label>
        <textarea class="textarea article-textarea" name="body" required>
${E(resource.body || '')}</textarea
        >
      </div>
      <div class="formrow">
        <label class="label">Tags</label>
        <input class="field" name="tags" value="${E(tags)}" />
      </div>
      <button class="solid">Salvar alterações</button>
    </form>
  </details>`;
}

async function adminPanel(tab = 'overview') {
  const staffRoles = ['moderator', 'curator', 'editor', 'admin'];
  const canModerate = tab === 'moderacao' && staffRoles.includes(state.me?.role);
  if (!state.me || (state.me.role !== 'admin' && !canModerate)) {
    layout(
      html`<section class="pagehero">
        <div class="shell">${empty('Acesso restrito à administração.')}</div>
      </section>`,
    );
    return;
  }
  let data;
  try {
    data = await api(state.me.role === 'admin' ? '/api/admin/dashboard' : '/api/admin/queue');
  } catch (err) {
    toast(err.message, true);
    return;
  }
  if (tab === 'overview') {
    const m = data.metrics;
    const pending = [
      ...data.publications
        .filter((item) => item.status === 'pending_review')
        .map((item) => ({ ...item, reviewType: 'publication', reviewArea: 'Biblioteca' })),
      ...data.techResources
        .filter((item) => item.status === 'pending_review')
        .map((item) => ({ ...item, reviewType: 'tech_resource', reviewArea: 'Oficina' })),
    ]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 8);
    const reports = data.reports
      .filter((r) => ['open', 'reviewing'].includes(r.status))
      .sort((a, b) => (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1))
      .slice(0, 5);
    return adminShell(
      'overview',
      'Painel de administração',
      'Controle central do Studiorium sem precisar editar código.',
      html`<div class="admin-stats">
          <div class="admin-stat">
            <strong>${num(m.users)}</strong><span>Usuários</span
            ><small>${num(m.suspendedUsers)} suspensos</small>
          </div>
          <div class="admin-stat">
            <strong>${num(m.pendingPublications + m.pendingTechResources)}</strong
            ><span>Em revisão</span
            ><small
              >${num(m.pendingPublications)} biblioteca · ${num(m.pendingTechResources)}
              oficina</small
            >
          </div>
          <div class="admin-stat">
            <strong>${num(m.openReports)}</strong><span>Denúncias abertas</span
            ><small>${num(m.urgentReports)} urgentes</small>
          </div>
          <div class="admin-stat">
            <strong>${num(m.pendingVerifications)}</strong><span>Verificações</span
            ><small>${num(m.discussions)} discussões · ${num(m.templates)} modelos</small>
          </div>
        </div>
        <div class="grid grid2 admin-gap">
          <div class="card">
            <div class="sectionhead">
              <div>
                <div class="eyebrow">Fila editorial</div>
                <h2>Conteúdos aguardando</h2>
              </div>
              ${link('/admin/oficina', 'Abrir Oficina →', 'linkbtn')}
            </div>
            ${pending
              .map(
                (p) =>
                  html`<div class="admin-row">
                    <div>
                      <strong>${E(p.title)}</strong
                      ><small>${E(p.reviewArea)} · ${E(p.authorName)} · ${date(p.createdAt)}</small>
                    </div>
                    <div class="actions">
                      <button
                        class="solid"
                        data-admin-content="${E(p.reviewType)}:${E(p.id)}:published"
                      >
                        Aprovar</button
                      ><button
                        class="dangerbtn"
                        data-admin-content="${E(p.reviewType)}:${E(p.id)}:rejected"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>`,
              )
              .join('') || empty('Nenhum conteúdo aguardando.')}
          </div>
          <div class="card">
            <div class="sectionhead">
              <div>
                <div class="eyebrow">Segurança</div>
                <h2>Denúncias prioritárias</h2>
              </div>
              ${link('/admin/moderacao', 'Abrir fila →', 'linkbtn')}
            </div>
            ${reports
              .map(
                (r) =>
                  html`<div class="admin-row">
                    <div>
                      <strong>${r.priority === 'urgent' ? '⚠ ' : ''}${E(r.category)}</strong
                      ><small>${E(r.target?.title || r.targetType)} · ${date(r.createdAt)}</small>
                    </div>
                    ${adminStatus(r.status)}
                  </div>`,
              )
              .join('') || empty('Nenhuma denúncia aberta.')}
          </div>
        </div>`,
    );
  }
  if (tab === 'moderacao') {
    const reports = data.reports
      .filter((r) => ['open', 'reviewing'].includes(r.status))
      .sort(
        (a, b) =>
          (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1) ||
          b.createdAt.localeCompare(a.createdAt),
      );
    return adminShell(
      'moderacao',
      'Moderação e denúncias',
      'Analise denúncias, veja o conteúdo alvo e tome uma decisão sem excluir registros permanentemente.',
      `${
        reports
          .map(
            (r) =>
              html`<article class="card admin-report">
                <div class="sectionhead">
                  <div>
                    <span class="badge ${r.priority === 'urgent' ? 'urgent' : ''}"
                      >${E(r.priority)}</span
                    >
                    <h3>${E(r.category)} · ${E(r.targetType)}</h3>
                  </div>
                  ${adminStatus(r.status)}
                </div>
                <p><strong>${E(r.target?.title || 'Conteúdo denunciado')}</strong></p>
                <p class="muted">
                  ${E(
                    (r.target?.excerpt || r.description || 'Sem descrição adicional.').slice(
                      0,
                      500,
                    ),
                  )}
                </p>
                <div class="meta">
                  <span>Autor: ${E(r.target?.authorName || '—')}</span
                  ><span>${date(r.createdAt)}</span>
                </div>
                <div class="actions admin-actions">
                  <button class="outline" data-report-status="${E(r.id)}:reviewing">
                    Marcar em análise</button
                  ><button class="solid" data-report-status="${E(r.id)}:resolved">
                    Resolver denúncia</button
                  ><button class="soft" data-report-status="${E(r.id)}:dismissed">
                    Descartar denúncia</button
                  >${r.target
                    ? html`<button
                        class="dangerbtn"
                        data-admin-content="${E(r.targetType)}:${E(r.targetId)}:${r.targetType ===
                        'publication'
                          ? 'rejected'
                          : 'hidden'}"
                      >
                        Ocultar conteúdo
                      </button>`
                    : ''}
                </div>
              </article>`,
          )
          .join('') || empty('Nenhuma denúncia aberta.')
      }`,
    );
  }
  if (tab === 'usuarios') {
    const users = adminFilter(data.users, ['displayName', 'email', 'username', 'profileType']);
    return adminShell(
      'usuarios',
      'Usuários',
      'Suspenda contas, reative acesso e controle permissões administrativas.',
      html`${adminSearch('Nome, e-mail ou usuário…')}
        <div class="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Conta</th>
                <th>Função</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${users
                .map(
                  (u) =>
                    html`<tr>
                      <td>
                        <strong>${E(u.displayName)}</strong><br /><span class="muted"
                          >${E(u.email)}</span
                        >
                      </td>
                      <td>
                        ${E(u.profileType)}${u.isMinor
                          ? '<br><span class="badge urgent">Menor</span>'
                          : ''}
                      </td>
                      <td>${adminStatus(u.status)}</td>
                      <td>${adminStatus(u.role)}</td>
                      <td>${date(u.createdAt)}</td>
                      <td>
                        <div class="actions">
                          ${u.status === 'suspended'
                            ? html`<button class="solid" data-admin-user="${E(u.id)}:active">
                                Reativar
                              </button>`
                            : html`<button class="dangerbtn" data-admin-user="${E(u.id)}:suspended">
                                Suspender
                              </button>`}${u.id !== state.me.id
                            ? html`<label class="role-control">
                                <span>Função</span>
                                <select class="select" data-admin-role-select="${E(u.id)}">
                                  ${[
                                    ['user', 'Usuário'],
                                    ['moderator', 'Moderador'],
                                    ['curator', 'Curador'],
                                    ['editor', 'Editor'],
                                    ['admin', 'ADM'],
                                  ]
                                    .map(
                                      ([value, label]) =>
                                        html`<option value="${value}" ${u.role === value ? 'selected' : ''}>
                                          ${label}
                                        </option>`,
                                    )
                                    .join('')}
                                </select>
                              </label>`
                            : '<span class="muted small">Sua conta</span>'}
                        </div>
                      </td>
                    </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>`,
    );
  }
  if (tab === 'verificacoes') {
    const requests = adminFilter(data.verificationRequests || [], [
      'displayName',
      'username',
      'course',
      'institution',
      'specialty',
      'status',
    ]);
    return adminShell(
      'verificacoes',
      'Verificação de especialistas',
      'Confirme formação e área de atuação antes de conceder selos públicos.',
      html`${adminSearch('Nome, curso, instituição ou especialidade…')}
        <div class="admin-list">
          ${requests
            .map(
              (request) =>
                html`<article class="card verification-review">
                  <div class="sectionhead">
                    <div>
                      <div class="eyebrow">${E(request.profileType)} · @${E(request.username)}</div>
                      <h3>${E(request.displayName || 'Membro do Studiorium')}</h3>
                    </div>
                    ${adminStatus(request.status)}
                  </div>
                  <div class="verification-facts">
                    <span><strong>Curso</strong>${E(request.course)}</span>
                    <span><strong>Instituição</strong>${E(request.institution)}</span>
                    <span><strong>Formação</strong>${E(request.educationLevel || 'Não informada')}</span>
                    <span><strong>Especialidade</strong>${E(request.specialty)}</span>
                  </div>
                  <p>${E(request.statement)}</p>
                  ${request.credentialReference
                    ? html`<p class="small">
                        Referência informada:
                        <a href="${E(request.credentialReference)}" target="_blank" rel="noopener noreferrer">
                          consultar comprovação ↗
                        </a>
                      </p>`
                    : ''}
                  ${request.status === 'pending'
                    ? html`<div class="actions admin-actions">
                        <button
                          class="solid"
                          data-admin-verification="${E(request.id)}:approved:specialist"
                        >
                          Verificar especialista
                        </button>
                        <button
                          class="outline"
                          data-admin-verification="${E(request.id)}:approved:active_collaborator"
                        >
                          Verificar colaborador
                        </button>
                        <button
                          class="dangerbtn"
                          data-admin-verification="${E(request.id)}:rejected:member"
                        >
                          Recusar
                        </button>
                      </div>`
                    : html`<p class="small muted">Analisada em ${date(request.updatedAt)}.</p>`}
                </article>`,
            )
            .join('') || empty('Nenhuma solicitação de verificação encontrada.')}
        </div>`,
    );
  }
  if (tab === 'publicacoes') {
    const pubs = adminFilter(data.publications, ['title', 'authorName', 'area', 'level', 'status']);
    return adminShell(
      'publicacoes',
      'Publicações e Biblioteca',
      'Aprove, rejeite, devolva para revisão e escolha conteúdos em destaque.',
      `${adminSearch('Título, autor, área ou status…')}<div class="admin-list">${
        pubs
          .map(
            (p) =>
              html`<article class="card">
                <div class="sectionhead">
                  <div>
                    <div class="eyebrow">${E(p.area)} · ${E(p.level)}</div>
                    <h3>${E(p.title)}</h3>
                  </div>
                  <div>
                    ${adminStatus(p.status)}
                    ${p.featured ? '<span class="badge">Destaque</span>' : ''}
                  </div>
                </div>
                <p>${E((p.abstract || '').slice(0, 320))}</p>
                <div class="meta">
                  <span>${E(p.authorName)}</span><span>${num(p.views)} leituras</span
                  ><span>${date(p.createdAt)}</span>
                </div>
                ${p.status !== 'published' ? adminPublicationEditor(p) : ''}
                <div class="actions admin-actions">
                  ${p.status !== 'published'
                    ? html`<button
                        class="solid"
                        data-admin-content="publication:${E(p.id)}:published"
                      >
                        Publicar
                      </button>`
                    : ''}${p.status !== 'pending_review'
                    ? html`<button
                        class="outline"
                        data-admin-content="publication:${E(p.id)}:pending_review"
                      >
                        Mandar para revisão
                      </button>`
                    : ''}${p.status !== 'rejected'
                    ? html`<button
                        class="dangerbtn"
                        data-admin-content="publication:${E(p.id)}:rejected"
                      >
                        Rejeitar
                      </button>`
                    : ''}<button
                    class="soft"
                    data-admin-feature-publication="${E(p.id)}:${p.featured ? 'false' : 'true'}"
                  >
                    ${p.featured ? 'Remover destaque' : 'Destacar'}</button
                  >${p.status === 'published'
                    ? link('/pesquisas/' + encodeURIComponent(p.slug), 'Abrir', 'outline')
                    : html`<button
                        class="dangerbtn"
                        data-admin-delete-content="publication:${E(p.id)}"
                      >
                        Apagar definitivamente
                      </button>`}
                </div>
              </article>`,
          )
          .join('') || empty('Nenhuma publicação encontrada.')
      }</div>`,
    );
  }
  if (tab === 'oficina') {
    const resources = adminFilter(data.techResources, [
      'title',
      'authorName',
      'hub',
      'category',
      'status',
    ]);
    return adminShell(
      'oficina',
      'Oficina e tecnologia',
      'Revise tutoriais, projetos práticos e conteúdos de tecnologia enviados pela comunidade.',
      `${adminSearch('Título, autor, área, categoria ou status…')}<div class="admin-list">${
        resources
          .map(
            (item) =>
              html`<article class="card">
                <div class="sectionhead">
                  <div>
                    <div class="eyebrow">${E(item.hub)} · ${E(item.category)}</div>
                    <h3>${E(item.title)}</h3>
                  </div>
                  <div>
                    ${adminStatus(item.status)}
                    ${item.featured ? '<span class="badge">Destaque</span>' : ''}
                  </div>
                </div>
                <p>${E((item.summary || '').slice(0, 360))}</p>
                <details class="review-details">
                  <summary>Ler conteúdo completo</summary>
                  <p class="article-preview">${E(item.body || '')}</p>
                </details>
                <div class="meta">
                  <span>${E(item.authorName)}</span><span>${date(item.createdAt)}</span>
                </div>
                ${item.status !== 'published' ? adminTechEditor(item) : ''}
                <div class="actions admin-actions">
                  ${item.status !== 'published'
                    ? html`<button
                        class="solid"
                        data-admin-content="tech_resource:${E(item.id)}:published"
                      >
                        Publicar
                      </button>`
                    : ''}
                  ${item.status !== 'pending_review'
                    ? html`<button
                        class="outline"
                        data-admin-content="tech_resource:${E(item.id)}:pending_review"
                      >
                        Mandar para revisão
                      </button>`
                    : ''}
                  ${item.status !== 'rejected'
                    ? html`<button
                        class="dangerbtn"
                        data-admin-content="tech_resource:${E(item.id)}:rejected"
                      >
                        Rejeitar
                      </button>`
                    : ''}
                  ${item.status !== 'published'
                    ? html`<button
                        class="dangerbtn"
                        data-admin-delete-content="tech_resource:${E(item.id)}"
                      >
                        Apagar definitivamente
                      </button>`
                    : ''}
                </div>
              </article>`,
          )
          .join('') || empty('Nenhum conteúdo da Oficina encontrado.')
      }</div>`,
    );
  }
  if (tab === 'coloquio') {
    const discussions = adminFilter(data.discussions, [
      'title',
      'authorName',
      'category',
      'status',
    ]);
    return adminShell(
      'coloquio',
      'Colóquio',
      'Gerencie discussões públicas e oculte conteúdos sem apagá-los do banco.',
      `${adminSearch('Título, autor, categoria ou status…')}<div class="admin-list">${
        discussions
          .map(
            (d) =>
              html`<article class="card">
                <div class="sectionhead">
                  <div>
                    <div class="eyebrow">${E(d.category)}</div>
                    <h3>${E(d.title)}</h3>
                  </div>
                  ${adminStatus(d.status)}
                </div>
                <p>${E((d.body || '').slice(0, 360))}</p>
                <div class="meta">
                  <span>${E(d.authorName)}</span><span>${date(d.createdAt)}</span>
                </div>
                <div class="actions admin-actions">
                  ${d.status !== 'published'
                    ? html`<button
                        class="solid"
                        data-admin-content="discussion:${E(d.id)}:published"
                      >
                        Publicar
                      </button>`
                    : ''}${d.status !== 'hidden'
                    ? html`<button
                        class="dangerbtn"
                        data-admin-content="discussion:${E(d.id)}:hidden"
                      >
                        Ocultar
                      </button>`
                    : ''}${d.status !== 'pending_review'
                    ? html`<button
                        class="outline"
                        data-admin-content="discussion:${E(d.id)}:pending_review"
                      >
                        Revisar
                      </button>`
                    : ''}
                </div>
              </article>`,
          )
          .join('') || empty('Nenhuma discussão encontrada.')
      }</div>`,
    );
  }
  if (tab === 'acervo') {
    return adminShell(
      'acervo',
      'Acervo de modelos',
      'Edite informações dos modelos e escolha quais aparecem em destaque na página inicial.',
      html`<div class="admin-list">
        ${data.templates
          .map(
            (t) =>
              html`<form class="card" data-admin-template="${E(t.id)}">
                <div class="sectionhead">
                  <div>
                    <div class="eyebrow">Modelo</div>
                    <h3>${E(t.title)}</h3>
                  </div>
                  <label class="small"
                    ><input type="checkbox" name="featured" ${t.featured ? 'checked' : ''} />
                    Destaque</label
                  >
                </div>
                <div class="formgrid">
                  <div>
                    <label class="label">Título</label
                    ><input class="field" name="title" value="${E(t.title)}" />
                  </div>
                  <div>
                    <label class="label">Categoria</label
                    ><input class="field" name="category" value="${E(t.category)}" />
                  </div>
                  <div>
                    <label class="label">Tipo de documento</label
                    ><input class="field" name="docType" value="${E(t.docType)}" />
                  </div>
                  <div>
                    <label class="label">Estilo</label
                    ><input class="field" name="style" value="${E(t.style)}" />
                  </div>
                </div>
                <div class="formrow" style="margin-top:14px">
                  <label class="label">Descrição</label
                  ><textarea class="textarea" name="description">${E(t.description)}</textarea>
                </div>
                <div class="actions">
                  <button class="solid">Salvar modelo</button>${link(
                    '/templates/' + encodeURIComponent(t.slug),
                    'Abrir modelo',
                    'outline',
                  )}
                </div>
              </form>`,
          )
          .join('')}
      </div>`,
    );
  }
  if (tab === 'noticias') {
    const editorial = await api('/api/admin/news');
    const pendingContributors = editorial.contributors.filter((item) => item.status === 'pending');
    const reviewArticles = editorial.articles.filter((item) =>
      ['editorial_review', 'changes_requested'].includes(item.status),
    );
    const pendingTemplates = editorial.templates.filter((item) => item.status === 'pending_review');
    return adminShell(
      'noticias',
      'Redação e templates livres',
      'Aprovação humana obrigatória para colaboradores, matérias e modelos da comunidade.',
      html`<div class="grid grid2">
          <section class="card">
            <div class="eyebrow">Credenciamento</div>
            <h2>Novos colaboradores</h2>
            ${pendingContributors
              .map(
                (item) =>
                  html`<div class="admin-row">
                    <div>
                      <strong>${E(item.area)}</strong>
                      <small
                        >${E(item.institution || 'Sem instituição')} ·
                        ${E(item.statement.slice(0, 180))}</small
                      >
                    </div>
                    <div class="actions">
                      <button class="solid" data-admin-contributor="${E(item.userId)}:approved">
                        Aprovar
                      </button>
                      <button class="dangerbtn" data-admin-contributor="${E(item.userId)}:rejected">
                        Rejeitar
                      </button>
                    </div>
                  </div>`,
              )
              .join('') || empty('Nenhum credenciamento aguardando.')}
          </section>
          <section class="card">
            <div class="eyebrow">Templates livres</div>
            <h2>Modelos aguardando</h2>
            ${pendingTemplates
              .map(
                (template) =>
                  html`<div class="admin-row">
                    <div>
                      <strong>${E(template.title)}</strong><small>${E(template.description)}</small>
                    </div>
                    <div class="actions">
                      <button
                        class="solid"
                        data-admin-custom-template="${E(template.id)}:published"
                      >
                        Publicar
                      </button>
                      <button
                        class="dangerbtn"
                        data-admin-custom-template="${E(template.id)}:rejected"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>`,
              )
              .join('') || empty('Nenhum template aguardando.')}
          </section>
        </div>
        <div class="sectionhead section-gap">
          <div>
            <div class="eyebrow">Certificação</div>
            <h2>Matérias em revisão</h2>
          </div>
        </div>
        <div class="admin-list">
          ${reviewArticles
            .map(
              (article) =>
                html`<article class="card">
                  <div class="sectionhead">
                    <div>
                      <div class="eyebrow">${E(article.category)}</div>
                      <h3>${E(article.title)}</h3>
                    </div>
                    <span class="badge status-${E(article.aiReviewStatus)}"
                      >Triagem: ${E(article.aiReviewStatus)}</span
                    >
                  </div>
                  <p>${E(article.summary)}</p>
                  <details class="review-details">
                    <summary>Ver texto, fontes e triagem</summary>
                    <p class="article-preview">${E(article.body)}</p>
                    <ul>
                      ${article.sources
                        .map(
                          (source) =>
                            html`<li>
                              <a href="${E(source.url)}" target="_blank" rel="noopener"
                                >${E(source.title)} ↗</a
                              >
                            </li>`,
                        )
                        .join('')}
                    </ul>
                    <div class="notice">
                      ${E(article.aiReview?.summary || 'Sem resumo da triagem.')}
                    </div>
                  </details>
                  <div class="actions admin-actions">
                    <button class="solid" data-admin-news="${E(article.id)}:published">
                      Certificar e publicar
                    </button>
                    <button class="outline" data-admin-news="${E(article.id)}:changes_requested">
                      Pedir alterações
                    </button>
                    <button class="dangerbtn" data-admin-news="${E(article.id)}:rejected">
                      Rejeitar
                    </button>
                  </div>
                </article>`,
            )
            .join('') || empty('Nenhuma matéria aguardando certificação.')}
        </div>`,
    );
  }
  if (tab === 'configuracoes') {
    const c = data.settings || {};
    return adminShell(
      'configuracoes',
      'Configurações do site',
      'Altere textos principais e controles gerais sem abrir os arquivos do projeto.',
      html`<form class="card admin-settings" data-admin-settings>
        <div class="formgrid">
          <div>
            <label class="label">Nome do site</label
            ><input class="field" name="site_title" value="${E(c.site_title || 'Studiorium')}" />
          </div>
          <div>
            <label class="label">Título principal</label
            ><input
              class="field"
              name="hero_title"
              value="${E(c.hero_title || 'Conhecimento que deixa vestígios.')}"
            />
          </div>
        </div>
        <div class="formrow" style="margin-top:16px">
          <label class="label">Texto principal da home</label
          ><textarea class="textarea" name="hero_text">${E(c.hero_text || '')}</textarea>
        </div>
        <div class="formrow">
          <label class="label">Aviso geral no topo</label
          ><input
            class="field"
            name="site_notice"
            value="${E(c.site_notice || '')}"
            placeholder="Deixe vazio para não mostrar aviso"
          />
        </div>
        <div class="admin-toggles">
          <label
            ><input
              type="checkbox"
              name="registrations_open"
              ${c.registrations_open !== false ? 'checked' : ''}
            />
            Permitir novos cadastros</label
          ><label
            ><input
              type="checkbox"
              name="maintenance_mode"
              ${c.maintenance_mode ? 'checked' : ''}
            />
            Mostrar modo de manutenção</label
          >
        </div>
        <div class="notice">
          Essas opções ficam no banco de dados. Alterar aqui não exige novo deploy do site.
        </div>
        <div class="actions" style="margin-top:16px">
          <button class="solid">Salvar configurações</button>
        </div>
      </form>`,
    );
  }
  if (tab === 'registro') {
    return adminShell(
      'registro',
      'Registro administrativo',
      'Histórico das ações feitas pelo painel para facilitar auditoria e recuperação de decisões.',
      html`<div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ação</th>
              <th>Tipo</th>
              <th>Alvo</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            ${data.audit
              .map(
                (a) =>
                  html`<tr>
                    <td>${date(a.createdAt)}</td>
                    <td>${E(a.action)}</td>
                    <td>${E(a.targetType)}</td>
                    <td>${E(a.targetId || '—')}</td>
                    <td><code>${E(JSON.stringify(a.details || {}).slice(0, 240))}</code></td>
                  </tr>`,
              )
              .join('') || '<tr><td colspan="5">Nenhuma ação registrada ainda.</td></tr>'}
          </tbody>
        </table>
      </div>`,
    );
  }
  return adminPanel('overview');
}

async function moderacao() {
  return adminPanel('moderacao');
}

export { adminTabs, adminStatus, adminShell, adminFilter, adminSearch, adminPanel, moderacao };

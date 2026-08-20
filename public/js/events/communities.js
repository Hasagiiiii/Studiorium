import { api, bootstrap, E, html, state, toast } from '../runtime.js';
import { goto, render, updateQuery } from '../router.js';
import { discussionForm } from './composers.js';
import { confirmAction, withBusyControl } from '../ui-feedback.js';

const roleLabels = {
  member: 'Membro',
  curator: 'Curador',
  moderator: 'Moderador',
  leader: 'Líder',
};

const membershipStatusLabels = {
  active: 'Participando',
  left: 'Saiu',
};

const moderationStatusLabels = {
  clear: 'Liberado',
  muted: 'Silenciado',
  removed: 'Removido',
};

async function refreshCommunityState() {
  state.boot = null;
  await bootstrap();
  await render();
}

function option(value, current, label) {
  return html`<option value="${E(value)}" ${value === current ? 'selected' : ''}>
    ${E(label)}
  </option>`;
}

function managementMarkup(data, slug) {
  const permissions = data.permissions || [];
  const canRoles = permissions.includes('manage_roles');
  const canModerate = permissions.includes('moderate_members');
  const canRules = permissions.includes('manage_rules');
  const isAdmin = state.me?.role === 'admin';
  const roles = isAdmin
    ? ['member', 'curator', 'moderator', 'leader']
    : ['member', 'curator', 'moderator'];

  const members = (data.members || [])
    .map((member) => {
      const protectedLeader = member.role === 'leader' && !isAdmin;
      const moderatorLimit = !canRoles && member.role !== 'member';
      const selfProtected = member.userId === state.me?.id && !isAdmin;
      const trustedRoleEligible = member.status === 'active' && member.moderationStatus === 'clear';
      const roleControl = canRoles && !protectedLeader && !selfProtected && trustedRoleEligible;
      const moderationControl =
        canModerate && !protectedLeader && !moderatorLimit && !selfProtected;

      return html`<form
        class="community-member-row"
        data-community-member-form
        data-community-slug="${E(slug)}"
        data-community-user="${E(member.userId)}"
      >
        <div class="community-member-identity">
          <strong>${E(member.displayName)}</strong>
          <span>${E(roleLabels[member.role] || member.role)}</span>
          ${member.verificationStatus === 'verified'
            ? html`<small
                >Verificado${member.verifiedSpecialty
                  ? ` · ${E(member.verifiedSpecialty)}`
                  : ''}</small
              >`
            : ''}
        </div>
        <div class="community-member-controls">
          ${roleControl
            ? html`<label>
                <span>Função</span>
                <select class="select" name="role">
                  ${roles.map((role) => option(role, member.role, roleLabels[role])).join('')}
                </select>
              </label>`
            : html`<label>
                <span>Função</span>
                <input
                  class="field"
                  value="${E(roleLabels[member.role] || member.role)}"
                  disabled
                />
              </label>`}
          <label>
            <span>Participação</span>
            <input
              class="field"
              value="${E(membershipStatusLabels[member.status] || member.status)}"
              disabled
            />
          </label>
          ${moderationControl
            ? html`<label>
                <span>Moderação</span>
                <select class="select" name="moderationStatus">
                  ${Object.keys(moderationStatusLabels)
                    .map((status) =>
                      option(status, member.moderationStatus, moderationStatusLabels[status]),
                    )
                    .join('')}
                </select>
              </label>`
            : html`<label>
                <span>Moderação</span>
                <input
                  class="field"
                  value="${E(
                    moderationStatusLabels[member.moderationStatus] || member.moderationStatus,
                  )}"
                  disabled
                />
              </label>`}
        </div>
        ${roleControl || moderationControl ? '<button class="soft">Salvar</button>' : ''}
      </form>`;
    })
    .join('');

  return html`<div class="community-management-panel">
    ${canRules
      ? html`<form
          class="community-rules-form"
          data-community-rules-form
          data-community-slug="${E(slug)}"
        >
          <div>
            <div class="eyebrow">Regras locais</div>
            <h3>Orientações desta comunidade</h3>
            <p class="small muted">
              Uma regra por linha, até 12 regras. As Diretrizes gerais continuam acima delas.
            </p>
          </div>
          <textarea class="textarea" name="rules" rows="6">
${E((data.community.rules || []).join('\n'))}</textarea
          >
          <button class="solid">Salvar regras</button>
        </form>`
      : ''}
    <div class="community-member-management">
      <div class="sectionhead">
        <div>
          <div class="eyebrow">Participantes</div>
          <h3>Equipe e membros</h3>
        </div>
        <span class="small muted">${data.members?.length || 0} registros</span>
      </div>
      ${members || '<div class="empty">Ainda não há participantes para gerenciar.</div>'}
      ${canRoles
        ? html`<p class="small muted community-role-note">
            ${isAdmin
              ? 'Como ADM, você pode nomear ou substituir o Líder. Líderes locais distribuem apenas as funções de Moderador e Curador.'
              : 'Como Líder, você pode nomear Moderadores e Curadores. Somente o ADM pode criar ou substituir outro Líder.'}
          </p>`
        : ''}
    </div>
  </div>`;
}

async function loadManagement(slug) {
  const target = document.getElementById('communityManagement');
  if (!target) return;
  target.innerHTML = '<div class="loading">Abrindo a gestão local…</div>';
  const data = await api(`/api/communities/${encodeURIComponent(slug)}/members`);
  target.innerHTML = managementMarkup(data, slug);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function handleCommunitiesClick(event) {
  const join = event.target.closest('[data-community-join]');
  if (join) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    await withBusyControl(join, 'Entrando…', async () => {
      const data = await api(
        `/api/communities/${encodeURIComponent(join.dataset.communityJoin)}/membership`,
        { method: 'POST' },
      );
      toast(data.message || 'Você entrou na comunidade.');
      await refreshCommunityState();
    });
    return true;
  }

  const leave = event.target.closest('[data-community-leave]');
  if (leave) {
    const confirmed = await confirmAction('Sair desta comunidade?', {
      title: 'Sair da comunidade',
      confirmLabel: 'Sair',
    });
    if (!confirmed) return true;
    await withBusyControl(leave, 'Saindo…', async () => {
      const data = await api(
        `/api/communities/${encodeURIComponent(leave.dataset.communityLeave)}/membership`,
        { method: 'DELETE' },
      );
      toast(data.message || 'Você saiu da comunidade.');
      await refreshCommunityState();
    });
    return true;
  }

  const discussion = event.target.closest('[data-community-discussion]');
  if (discussion) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const composer = document.getElementById('communityComposer');
    if (!composer) return true;
    composer.innerHTML = discussionForm({
      communitySlug: discussion.dataset.communityDiscussion,
      communityName: discussion.dataset.communityName,
    });
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  const contentModeration = event.target.closest('[data-community-content-status]');
  if (contentModeration) {
    const nextStatus = contentModeration.dataset.communityContentStatus;
    if (nextStatus === 'hidden') {
      const confirmed = await confirmAction('Ocultar este conteúdo desta comunidade?', {
        title: 'Moderação local',
        confirmLabel: 'Ocultar',
      });
      if (!confirmed) return true;
    }

    const slug = contentModeration.dataset.communitySlug;
    const type = contentModeration.dataset.communityContentType;
    const id = contentModeration.dataset.communityContentId;
    await withBusyControl(
      contentModeration,
      nextStatus === 'hidden' ? 'Ocultando…' : 'Restaurando…',
      async () => {
        const data = await api(
          `/api/communities/${encodeURIComponent(slug)}/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}/moderation`,
          { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) },
        );
        toast(data.message || 'Moderação local atualizada.');
        await render();
      },
    );
    return true;
  }

  const manage = event.target.closest('[data-community-manage]');
  if (manage) {
    await loadManagement(manage.dataset.communityManage);
    return true;
  }

  return false;
}

export async function handleCommunitiesSubmit(event) {
  const form = event.target;

  if (form.matches('[data-community-filter]')) {
    event.preventDefault();
    const data = new FormData(form);
    updateQuery({ q: data.get('q'), area: data.get('area') });
    return true;
  }

  if (form.matches('[data-community-rules-form]')) {
    event.preventDefault();
    const slug = form.dataset.communitySlug;
    const rules = String(new FormData(form).get('rules') || '')
      .split('\n')
      .map((rule) => rule.trim())
      .filter(Boolean)
      .slice(0, 12);
    const button = form.querySelector('[type="submit"], button:not([type])');
    await withBusyControl(button, 'Salvando…', async () => {
      const data = await api(`/api/communities/${encodeURIComponent(slug)}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ rules }),
      });
      toast(data.message || 'Regras atualizadas.');
      await render();
      await loadManagement(slug);
    });
    return true;
  }

  if (form.matches('[data-community-member-form]')) {
    event.preventDefault();
    const slug = form.dataset.communitySlug;
    const userId = form.dataset.communityUser;
    const values = new FormData(form);
    const payload = {};
    if (values.has('role')) payload.role = values.get('role');
    if (values.has('moderationStatus')) {
      payload.moderationStatus = values.get('moderationStatus');
    }
    const button = form.querySelector('[type="submit"], button:not([type])');
    await withBusyControl(button, 'Salvando…', async () => {
      const data = await api(
        `/api/communities/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      );
      toast(data.message || 'Função atualizada.');
      await render();
      await loadManagement(slug);
    });
    return true;
  }

  return false;
}

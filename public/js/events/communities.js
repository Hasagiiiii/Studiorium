import { api, bootstrap, state, toast } from '../runtime.js';
import { goto, render, updateQuery } from '../router.js';
import { discussionForm } from './composers.js';
import { confirmAction, withBusyControl } from '../ui-feedback.js';

async function refreshCommunityState() {
  state.boot = null;
  await bootstrap();
  await render();
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

  return false;
}

export function handleCommunitiesSubmit(event) {
  const form = event.target;
  if (!form.matches('[data-community-filter]')) return false;
  event.preventDefault();
  const data = new FormData(form);
  updateQuery({ q: data.get('q'), area: data.get('area') });
  return true;
}

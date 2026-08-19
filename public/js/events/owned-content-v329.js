import { api, bootstrap, state, toast } from '../runtime.js';
import { render } from '../router.js';
import { confirmAction, formDialog, withBusyControl } from '../ui-feedback.js';

async function refreshPrivateArea(message) {
  state.boot = null;
  await bootstrap();
  toast(message);
  await render();
}

async function findOwned(kind, id) {
  const me = await api('/api/me');
  const collection = kind === 'discussion' ? me.discussions || [] : me.replies || [];
  return collection.find((item) => item.id === id) || null;
}

async function editDiscussion(button) {
  const id = button.dataset.editOwnDiscussion;
  const discussion = await findOwned('discussion', id);
  if (!discussion) throw new Error('Discussão não encontrada.');
  const values = await formDialog({
    title: 'Editar discussão',
    confirmLabel: 'Salvar alterações',
    fields: [
      { name: 'title', label: 'Título', value: discussion.title, required: true, maxLength: 180 },
      {
        name: 'category',
        label: 'Categoria',
        value: discussion.category,
        required: true,
        maxLength: 60,
      },
      {
        name: 'body',
        label: 'Texto',
        type: 'textarea',
        value: discussion.body,
        required: true,
        maxLength: 12000,
      },
    ],
  });
  if (!values) return;
  await withBusyControl(button, 'Salvando…', async () => {
    const result = await api(`/api/discussions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    await refreshPrivateArea(result.message || 'Discussão atualizada.');
  });
}

async function editReply(button) {
  const id = button.dataset.editOwnReply;
  const reply = await findOwned('reply', id);
  if (!reply) throw new Error('Resposta não encontrada.');
  const values = await formDialog({
    title: 'Editar resposta',
    confirmLabel: 'Salvar alterações',
    fields: [
      {
        name: 'body',
        label: 'Resposta',
        type: 'textarea',
        value: reply.body,
        required: true,
        maxLength: 6000,
      },
    ],
  });
  if (!values) return;
  await withBusyControl(button, 'Salvando…', async () => {
    const result = await api(`/api/replies/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    await refreshPrivateArea(result.message || 'Resposta atualizada.');
  });
}

async function removeOwned(button, kind) {
  const id =
    kind === 'discussion' ? button.dataset.deleteOwnDiscussion : button.dataset.deleteOwnReply;
  const label = kind === 'discussion' ? 'discussão' : 'resposta';
  const confirmed = await confirmAction(
    `Excluir definitivamente esta ${label}? Esta ação não pode ser desfeita.`,
    {
      title: `Excluir ${label}`,
      confirmLabel: 'Excluir definitivamente',
      danger: true,
    },
  );
  if (!confirmed) return;
  const endpoint = kind === 'discussion' ? 'discussions' : 'replies';
  await withBusyControl(button, 'Excluindo…', async () => {
    const result = await api(`/api/${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refreshPrivateArea(result.message || 'Conteúdo excluído definitivamente.');
  });
}

export async function handleOwnedContentClick(event) {
  const editDiscussionButton = event.target.closest('[data-edit-own-discussion]');
  if (editDiscussionButton) {
    await editDiscussion(editDiscussionButton);
    return true;
  }
  const editReplyButton = event.target.closest('[data-edit-own-reply]');
  if (editReplyButton) {
    await editReply(editReplyButton);
    return true;
  }
  const deleteDiscussionButton = event.target.closest('[data-delete-own-discussion]');
  if (deleteDiscussionButton) {
    await removeOwned(deleteDiscussionButton, 'discussion');
    return true;
  }
  const deleteReplyButton = event.target.closest('[data-delete-own-reply]');
  if (deleteReplyButton) {
    await removeOwned(deleteReplyButton, 'reply');
    return true;
  }
  return false;
}

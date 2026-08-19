import { api, bootstrap, formObj, state, toast } from '../runtime.js';
import { render } from '../router.js';
import { confirmAction, formDialog, promptAction, withBusyControl } from '../ui-feedback.js';

async function refreshBootstrapAndRender() {
  state.boot = null;
  await bootstrap();
  await render();
}

export async function handleAdminClick(event) {
  const reportStatus = event.target.closest('[data-report-status]');
  if (reportStatus) {
    const [id, status] = reportStatus.dataset.reportStatus.split(':');
    let note = '';
    if (['resolved', 'dismissed'].includes(status)) {
      const result = await formDialog({
        title: status === 'resolved' ? 'Resolver denúncia' : 'Descartar denúncia',
        message: 'Você pode registrar uma observação interna antes de concluir a ação.',
        confirmLabel: status === 'resolved' ? 'Resolver' : 'Descartar',
        fields: [{ name: 'note', label: 'Observação opcional', type: 'textarea', maxLength: 1500 }],
      });
      if (!result) return true;
      note = result.note || '';
    }
    await withBusyControl(reportStatus, 'Atualizando…', async () => {
      await api(`/api/admin/reports/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      toast('Denúncia atualizada.');
      await render();
    });
    return true;
  }

  const publicationStatus = event.target.closest('[data-pub-status]');
  if (publicationStatus) {
    const [id, status] = publicationStatus.dataset.pubStatus.split(':');
    await withBusyControl(publicationStatus, 'Atualizando…', async () => {
      await api(`/api/admin/publications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast('Publicação atualizada.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const contentStatus = event.target.closest('[data-admin-content]');
  if (contentStatus) {
    const [type, id, status] = contentStatus.dataset.adminContent.split(':');
    if (['hidden', 'rejected'].includes(status)) {
      const confirmed = await confirmAction(
        'Confirmar esta ação de moderação? O conteúdo não será apagado permanentemente.',
        {
          title: status === 'hidden' ? 'Ocultar conteúdo' : 'Rejeitar conteúdo',
          confirmLabel: status === 'hidden' ? 'Ocultar' : 'Rejeitar',
          danger: true,
        },
      );
      if (!confirmed) return true;
    }

    await withBusyControl(contentStatus, 'Atualizando…', async () => {
      await api(`/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast('Conteúdo atualizado.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const deleteContent = event.target.closest('[data-admin-delete-content]');
  if (deleteContent) {
    const [type, id] = deleteContent.dataset.adminDeleteContent.split(':');
    const confirmed = await confirmAction(
      'Apagar definitivamente este conteúdo rejeitado? Esta ação não pode ser desfeita.',
      {
        title: 'Exclusão definitiva',
        confirmLabel: 'Excluir definitivamente',
        danger: true,
      },
    );
    if (!confirmed) return true;
    await withBusyControl(deleteContent, 'Excluindo…', async () => {
      const result = await api(
        `/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      toast(result.message || 'Conteúdo apagado definitivamente.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const userStatus = event.target.closest('[data-admin-user]');
  if (userStatus) {
    const [id, status] = userStatus.dataset.adminUser.split(':');
    let reason = '';
    if (status === 'suspended') {
      const result = await formDialog({
        title: 'Suspender conta',
        message: 'As sessões ativas serão encerradas. O motivo ficará registrado para a administração.',
        confirmLabel: 'Suspender conta',
        danger: true,
        fields: [{ name: 'reason', label: 'Motivo da suspensão', type: 'textarea', maxLength: 1500 }],
      });
      if (!result) return true;
      reason = result.reason || '';
    }

    await withBusyControl(userStatus, 'Atualizando…', async () => {
      await api(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      toast(status === 'suspended' ? 'Conta suspensa.' : 'Conta reativada.');
      await render();
    });
    return true;
  }

  const userRole = event.target.closest('[data-admin-role]');
  if (userRole) {
    const [id, role] = userRole.dataset.adminRole.split(':');
    const question =
      role === 'admin'
        ? 'Dar permissão de administrador a esta conta?'
        : 'Remover a permissão de administrador desta conta?';
    const confirmed = await confirmAction(question, {
      title: 'Alterar permissão',
      confirmLabel: 'Alterar permissão',
      danger: role === 'admin',
    });
    if (!confirmed) return true;

    await withBusyControl(userRole, 'Atualizando…', async () => {
      await api(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      toast('Permissão atualizada.');
      await render();
    });
    return true;
  }

  const verification = event.target.closest('[data-admin-verification]');
  if (verification) {
    const [id, status, contributionStatus] = verification.dataset.adminVerification.split(':');
    const approved = status === 'approved';
    const result = await formDialog({
      title: approved ? 'Conceder selo público' : 'Recusar solicitação',
      message: approved
        ? 'Registre uma observação interna se necessário antes de confirmar a verificação.'
        : 'Explique o que precisa ser corrigido para que a pessoa possa reenviar.',
      confirmLabel: approved ? 'Conceder selo' : 'Recusar solicitação',
      danger: !approved,
      fields: [
        {
          name: 'note',
          label: approved ? 'Observação interna opcional' : 'Correção necessária',
          type: 'textarea',
          required: !approved,
          maxLength: 1500,
        },
      ],
    });
    if (!result) return true;
    await withBusyControl(verification, approved ? 'Verificando…' : 'Recusando…', async () => {
      await api(`/api/admin/verifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, contributionStatus, note: result.note || '' }),
      });
      toast(approved ? 'Perfil verificado.' : 'Solicitação devolvida.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const feature = event.target.closest('[data-admin-feature-publication]');
  if (feature) {
    const [id, value] = feature.dataset.adminFeaturePublication.split(':');
    const featured = value === 'true';
    await withBusyControl(feature, featured ? 'Destacando…' : 'Removendo…', async () => {
      await api(`/api/admin/publications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ featured }),
      });
      toast(featured ? 'Publicação destacada.' : 'Destaque removido.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const contributor = event.target.closest('[data-admin-contributor]');
  if (contributor) {
    const [id, status] = contributor.dataset.adminContributor.split(':');
    let note = '';
    if (status === 'rejected') {
      const value = await promptAction('Explique o que precisa ser revisto:', {
        title: 'Rejeitar credenciamento',
        label: 'Retorno ao colaborador',
        confirmLabel: 'Rejeitar',
        danger: true,
      });
      if (value === null) return true;
      note = value;
    }
    await withBusyControl(contributor, 'Atualizando…', async () => {
      await api(`/api/admin/news/contributors/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      toast('Credenciamento atualizado.');
      await render();
    });
    return true;
  }

  const newsFeature = event.target.closest('[data-admin-news-feature]');
  if (newsFeature) {
    const [id, value] = newsFeature.dataset.adminNewsFeature.split(':');
    const featured = value === 'true';
    await withBusyControl(newsFeature, featured ? 'Destacando…' : 'Removendo…', async () => {
      await api(`/api/admin/news/articles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ featured }),
      });
      toast(featured ? 'Notícia destacada na página inicial.' : 'Destaque da notícia removido.');
      state.boot = null;
      await bootstrap();
      await render();
    });
    return true;
  }

  const news = event.target.closest('[data-admin-news]');
  if (news) {
    const [id, status] = news.dataset.adminNews.split(':');
    const published = status === 'published';
    const result = await formDialog({
      title: published ? 'Certificar e publicar' : 'Registrar decisão editorial',
      message: published
        ? 'A decisão é humana. Registre uma nota quando a triagem tiver sinalizado riscos ou lacunas.'
        : 'Informe o retorno editorial que será registrado para esta matéria.',
      confirmLabel: published ? 'Certificar e publicar' : 'Registrar decisão',
      danger: status === 'rejected',
      fields: [
        {
          name: 'note',
          label: published ? 'Nota da decisão editorial' : 'Retorno editorial',
          type: 'textarea',
          required: !published,
          maxLength: 2000,
        },
      ],
    });
    if (!result) return true;
    await withBusyControl(news, published ? 'Publicando…' : 'Registrando…', async () => {
      await api(`/api/admin/news/articles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note: result.note || '' }),
      });
      toast(published ? 'Notícia certificada e publicada.' : 'Decisão editorial registrada.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  const customTemplate = event.target.closest('[data-admin-custom-template]');
  if (customTemplate) {
    const [id, status] = customTemplate.dataset.adminCustomTemplate.split(':');
    await withBusyControl(customTemplate, 'Atualizando…', async () => {
      await api(`/api/admin/custom-templates/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast('Template atualizado.');
      await refreshBootstrapAndRender();
    });
    return true;
  }

  return false;
}

export async function handleAdminChange(event) {
  const select = event.target.closest('[data-admin-role-select]');
  if (!select) return false;
  const id = select.dataset.adminRoleSelect;
  const role = select.value;
  const confirmed = await confirmAction(`Alterar a função desta conta para ${role}?`, {
    title: 'Alterar função da conta',
    confirmLabel: 'Alterar função',
  });
  if (!confirmed) {
    await render();
    return true;
  }
  await api(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  toast('Função atualizada.');
  await render();
  return true;
}

export async function handleAdminSubmit(event) {
  const form = event.target;

  if (form.matches('[data-admin-edit-content]')) {
    event.preventDefault();
    const [type, id] = form.dataset.adminEditContent.split(':');
    const result = await api(
      `/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}/details`,
      {
        method: 'PATCH',
        body: JSON.stringify(formObj(form)),
      },
    );
    toast(result.message || 'Conteúdo atualizado.');
    await refreshBootstrapAndRender();
    return true;
  }

  if (form.matches('[data-admin-template]')) {
    event.preventDefault();
    const values = formObj(form);
    values.featured = form.elements.featured.checked;
    await api(`/api/admin/templates/${encodeURIComponent(form.dataset.adminTemplate)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    toast('Modelo atualizado.');
    await refreshBootstrapAndRender();
    return true;
  }

  if (form.matches('[data-admin-settings]')) {
    event.preventDefault();
    const values = formObj(form);
    values.registrations_open = form.elements.registrations_open.checked;
    values.maintenance_mode = form.elements.maintenance_mode.checked;
    await api('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    toast('Configurações salvas.');
    await refreshBootstrapAndRender();
    return true;
  }

  return false;
}

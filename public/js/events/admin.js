import { api, bootstrap, formObj, state, toast } from '../runtime.js';
import { render } from '../router.js';

async function refreshBootstrapAndRender() {
  state.boot = null;
  await bootstrap();
  await render();
}

export async function handleAdminClick(event) {
  const reportStatus = event.target.closest('[data-report-status]');

  if (reportStatus) {
    const [id, status] = reportStatus.dataset.reportStatus.split(':');
    const note = ['resolved', 'dismissed'].includes(status)
      ? prompt('Observação da moderação (opcional):', '') || ''
      : '';
    await api(`/api/admin/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    toast('Denúncia atualizada.');
    await render();
    return true;
  }

  const publicationStatus = event.target.closest('[data-pub-status]');

  if (publicationStatus) {
    const [id, status] = publicationStatus.dataset.pubStatus.split(':');
    await api(`/api/admin/publications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast('Publicação atualizada.');
    await refreshBootstrapAndRender();
    return true;
  }

  const contentStatus = event.target.closest('[data-admin-content]');

  if (contentStatus) {
    const [type, id, status] = contentStatus.dataset.adminContent.split(':');
    const needsConfirmation = ['hidden', 'rejected'].includes(status);
    if (
      needsConfirmation &&
      !confirm(
        'Confirmar esta ação de moderação? ' + 'O conteúdo não será apagado permanentemente.',
      )
    ) {
      return true;
    }

    await api(`/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast('Conteúdo atualizado.');
    await refreshBootstrapAndRender();
    return true;
  }

  const deleteContent = event.target.closest('[data-admin-delete-content]');

  if (deleteContent) {
    const [type, id] = deleteContent.dataset.adminDeleteContent.split(':');
    if (
      !confirm('Apagar definitivamente este conteúdo rejeitado? Esta ação não pode ser desfeita.')
    ) {
      return true;
    }
    const result = await api(
      `/api/admin/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    toast(result.message || 'Conteúdo apagado definitivamente.');
    await refreshBootstrapAndRender();
    return true;
  }

  const userStatus = event.target.closest('[data-admin-user]');

  if (userStatus) {
    const [id, status] = userStatus.dataset.adminUser.split(':');
    let reason = '';

    if (status === 'suspended') {
      reason = prompt('Motivo da suspensão (será registrado para a administração):', '') || '';
      if (!confirm('Suspender esta conta e encerrar as sessões ativas?')) {
        return true;
      }
    }

    await api(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    toast(status === 'suspended' ? 'Conta suspensa.' : 'Conta reativada.');
    await render();
    return true;
  }

  const userRole = event.target.closest('[data-admin-role]');

  if (userRole) {
    const [id, role] = userRole.dataset.adminRole.split(':');
    const question =
      role === 'admin'
        ? 'Dar permissão de administrador a esta conta?'
        : 'Remover a permissão de administrador desta conta?';
    if (!confirm(question)) return true;

    await api(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    toast('Permissão atualizada.');
    await render();
    return true;
  }

  const feature = event.target.closest('[data-admin-feature-publication]');

  if (feature) {
    const [id, value] = feature.dataset.adminFeaturePublication.split(':');
    const featured = value === 'true';
    await api(`/api/admin/publications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ featured }),
    });
    toast(featured ? 'Publicação destacada.' : 'Destaque removido.');
    await refreshBootstrapAndRender();
    return true;
  }

  const contributor = event.target.closest('[data-admin-contributor]');
  if (contributor) {
    const [id, status] = contributor.dataset.adminContributor.split(':');
    const note =
      status === 'rejected' ? prompt('Explique o que precisa ser revisto:', '') || '' : '';
    await api(`/api/admin/news/contributors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    toast('Credenciamento atualizado.');
    await render();
    return true;
  }

  const news = event.target.closest('[data-admin-news]');
  if (news) {
    const [id, status] = news.dataset.adminNews.split(':');
    const promptText =
      status === 'published'
        ? 'Nota da decisão editorial (obrigatória se a IA sinalizou):'
        : 'Retorno editorial:';
    const note = prompt(promptText, '') || '';
    if (status !== 'published' && !note.trim()) return true;
    if (status === 'published' && !confirm('Certificar e publicar esta notícia em seu nome?'))
      return true;
    await api(`/api/admin/news/articles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    toast(
      status === 'published' ? 'Notícia certificada e publicada.' : 'Decisão editorial registrada.',
    );
    await refreshBootstrapAndRender();
    return true;
  }

  const customTemplate = event.target.closest('[data-admin-custom-template]');
  if (customTemplate) {
    const [id, status] = customTemplate.dataset.adminCustomTemplate.split(':');
    await api(`/api/admin/custom-templates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast('Template atualizado.');
    await refreshBootstrapAndRender();
    return true;
  }

  return false;
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

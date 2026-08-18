import { api, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

function codeEditorPayload() {
  return {
    title: document.querySelector('[name=codeTitle]').value,
    visibility: document.querySelector('[name=codeVisibility]').value,
    html: document.querySelector('[name=codeHtml]').value,
    css: document.querySelector('[name=codeCss]').value,
    javascript: document.querySelector('[name=codeJs]').value,
  };
}

function projectEditorPayload(root) {
  const sections = [...root.querySelectorAll('[data-doc-section]')].map((section) => ({
    name: section.querySelector('[name=sectionName]').value,
    content: section.querySelector('[name=sectionContent]').value,
  }));

  return {
    title: root.querySelector('[name=title]').value,
    sections,
    notes: document.querySelector('[data-project-notes]')?.value || '',
  };
}

export async function handleProjectClick(event) {
  if (event.target.closest('[data-new-code-project]')) {
    const data = await api('/api/code-projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Novo projeto' }),
    });
    goto(`/laboratorio/${data.project.id}`);
    return true;
  }

  if (event.target.closest('[data-run-code]')) {
    const { runCodePreview } = await import('../views.js');
    runCodePreview();
    return true;
  }

  const saveCode = event.target.closest('[data-save-code]');

  if (saveCode) {
    await api(`/api/code-projects/${encodeURIComponent(saveCode.dataset.saveCode)}`, {
      method: 'PATCH',
      body: JSON.stringify(codeEditorPayload()),
    });
    toast('Projeto de código salvo.');
    return true;
  }

  const templateButton = event.target.closest('[data-use-template]');

  if (templateButton) {
    if (!state.me) {
      goto('/login');
      return true;
    }

    const data = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        templateSlug: templateButton.dataset.useTemplate,
      }),
    });
    toast('Projeto criado na sua escrivaninha.');
    goto(`/editor/${data.project.id}`);
    return true;
  }

  const deleteButton = event.target.closest('[data-delete-project]');

  if (deleteButton) {
    if (!confirm('Mover este projeto para a lixeira?')) return true;

    await api(`/api/projects/${encodeURIComponent(deleteButton.dataset.deleteProject)}`, {
      method: 'DELETE',
    });
    toast('Projeto movido para a lixeira.');
    await render();
    return true;
  }

  const deleteCode = event.target.closest('[data-delete-code-project]');
  if (deleteCode) {
    if (!confirm('Mover este projeto de código para a lixeira?')) return true;
    await api(`/api/code-projects/${encodeURIComponent(deleteCode.dataset.deleteCodeProject)}`, {
      method: 'DELETE',
    });
    toast('Projeto de código movido para a lixeira.');
    await render();
    return true;
  }

  for (const [attribute, resource, endpoint, method, question, message] of [
    ['restoreProject', 'projects', '/restore', 'POST', '', 'Projeto restaurado.'],
    [
      'purgeProject',
      'projects',
      '/purge',
      'DELETE',
      'Excluir definitivamente este projeto?',
      'Projeto excluído definitivamente.',
    ],
    [
      'restoreCodeProject',
      'code-projects',
      '/restore',
      'POST',
      '',
      'Projeto de código restaurado.',
    ],
    [
      'purgeCodeProject',
      'code-projects',
      '/purge',
      'DELETE',
      'Excluir definitivamente este projeto de código?',
      'Projeto de código excluído definitivamente.',
    ],
  ]) {
    const name = attribute.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
    const button = event.target.closest(`[data-${name}]`);
    if (!button) continue;
    if (question && !confirm(question)) return true;
    await api(`/api/${resource}/${encodeURIComponent(button.dataset[attribute])}${endpoint}`, {
      method,
      body: method === 'POST' ? '{}' : undefined,
    });
    toast(message);
    await render();
    return true;
  }

  const saveButton = event.target.closest('[data-save-project]');

  if (saveButton) {
    const root = document.querySelector('[data-project-form]');
    if (!root) return true;

    await api(`/api/projects/${encodeURIComponent(saveButton.dataset.saveProject)}`, {
      method: 'PATCH',
      body: JSON.stringify(projectEditorPayload(root)),
    });
    toast('Projeto salvo.');
    return true;
  }

  return false;
}

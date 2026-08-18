import { api, bootstrap, fileToBase64, formObj, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';
import { discussionForm, techResourceForm } from './composers.js';

const MAX_PUBLICATION_BYTES = 5 * 1024 * 1024;

function requestReportDetails() {
  const category = prompt(
    'Categoria da denúncia: racismo, xenofobia, sexismo, machismo, ' +
      'assedio, bullying, risco_menor, dados_pessoais, plagio, spam, ' +
      'golpe, violencia ou outro',
    'outro',
  );

  if (!category) return null;

  return {
    category,
    description: prompt('Descreva brevemente o problema (opcional):', '') || '',
  };
}

async function publicationPayload(form) {
  const body = formObj(form);
  const file = form.querySelector('[data-publication-file]')?.files?.[0];

  if (!file) return body;
  if (file.size > MAX_PUBLICATION_BYTES) {
    throw new Error('O arquivo precisa ter até 5 MB.');
  }

  body.file = {
    name: file.name,
    mime: file.type,
    dataBase64: await fileToBase64(file),
  };
  return body;
}

export async function handleCommunityClick(event) {
  if (event.target.closest('[data-open-tech]')) {
    const composer = document.getElementById('techComposer');
    if (composer) composer.innerHTML = techResourceForm();
    return true;
  }

  if (event.target.closest('[data-new-discussion]')) {
    if (!state.me) {
      goto('/login');
      return true;
    }

    const composer = document.getElementById('discussionComposer');
    if (!composer) return true;
    composer.innerHTML = discussionForm();
    composer.scrollIntoView({ behavior: 'smooth' });
    return true;
  }

  const reportButton = event.target.closest('[data-report]');

  if (reportButton) {
    if (!state.me) {
      goto('/login');
      return true;
    }

    const details = requestReportDetails();
    if (!details) return true;
    const [targetType, targetId] = reportButton.dataset.report.split(':');

    await api('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, ...details }),
    });
    toast('Denúncia enviada para revisão.');
    return true;
  }

  return false;
}

export async function handleCommunitySubmit(event) {
  const form = event.target;

  if (form.matches('[data-tech-resource]')) {
    event.preventDefault();
    const data = await api('/api/tech-resources', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    toast(data.message || 'Enviado para revisão.');
    form.reset();
    return true;
  }

  if (form.matches('[data-publication]')) {
    event.preventDefault();
    const data = await api('/api/publications', {
      method: 'POST',
      body: JSON.stringify(await publicationPayload(form)),
    });
    toast(data.message || 'Trabalho enviado.');
    state.boot = null;
    await bootstrap();
    goto('/escrivaninha');
    return true;
  }

  if (form.matches('[data-new-discussion-form]')) {
    event.preventDefault();
    const data = await api('/api/discussions', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    state.boot = null;
    await bootstrap();
    toast('Discussão publicada.');
    goto(`/coloquio/${data.discussion.id}`);
    return true;
  }

  if (form.matches('[data-reply]')) {
    event.preventDefault();
    await api(`/api/discussions/${encodeURIComponent(form.dataset.reply)}/replies`, {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    toast('Resposta publicada.');
    await render();
    return true;
  }

  return false;
}

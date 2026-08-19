import { api, bootstrap, fileToBase64, formObj, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';
import { discussionForm, techResourceForm } from './composers.js';

const MAX_PUBLICATION_BYTES = 5 * 1024 * 1024;

function normalizedSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function commentSort(order, left, right) {
  const leftQuestion = left.dataset.commentQuestion === 'true' ? 1 : 0;
  const rightQuestion = right.dataset.commentQuestion === 'true' ? 1 : 0;
  const leftCreated = Number(left.dataset.commentCreated) || 0;
  const rightCreated = Number(right.dataset.commentCreated) || 0;

  if (order === 'recent') return rightCreated - leftCreated;
  if (order === 'oldest') return leftCreated - rightCreated;
  if (order === 'questions' && leftQuestion !== rightQuestion) {
    return rightQuestion - leftQuestion;
  }

  const similarity = Number(right.dataset.commentSimilar) - Number(left.dataset.commentSimilar);
  if (similarity) return similarity;
  return Number(left.dataset.commentIndex) - Number(right.dataset.commentIndex);
}

function refreshCommentMap(root) {
  const map = root?.matches?.('[data-comment-map]') ? root : root?.closest?.('[data-comment-map]');
  if (!map) return;

  const list = map.querySelector('[data-comment-list]');
  if (!list) return;

  const activeFilter = map.dataset.commentMapFilter || 'all';
  const query = normalizedSearch(map.querySelector('[data-comment-search]')?.value);
  const order = map.querySelector('[data-comment-order]')?.value || 'relevance';
  const items = [...list.querySelectorAll('[data-comment-item]')];

  items.sort((left, right) => commentSort(order, left, right));
  items.forEach((item) => list.append(item));

  let visible = 0;
  items.forEach((item) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'questions' && item.dataset.commentQuestion === 'true') ||
      item.dataset.commentCluster === activeFilter;
    const matchesSearch = !query || normalizedSearch(item.textContent).includes(query);
    item.hidden = !(matchesFilter && matchesSearch);
    if (!item.hidden) visible += 1;
  });

  const counter = map.querySelector('[data-comment-count]');
  const emptyState = map.querySelector('[data-comment-empty]');
  if (counter) counter.textContent = String(visible);
  if (emptyState) emptyState.hidden = visible > 0 || items.length === 0;
}

function refreshReplyQuality(textarea) {
  const panel = textarea.closest('form')?.querySelector('[data-reply-quality]');
  if (!panel) return;

  const text = textarea.value.trim();
  const checks = {
    '[data-quality-context]': text.length >= 40,
    '[data-quality-question]':
      /\?/.test(text) ||
      /^(como|onde|quando|qual|quais|por que|quem)\b/i.test(text) ||
      /\b(alguem sabe|nao entendi|tenho duvida|poderia explicar)\b/i.test(text),
    '[data-quality-reference]':
      /https?:\/\/|\b(fonte|referencia|exemplo|artigo|livro|pesquisa)\b/i.test(text),
  };

  Object.entries(checks).forEach(([selector, complete]) => {
    panel.querySelector(selector)?.classList.toggle('complete', complete);
  });
}

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
  const commentFilter = event.target.closest('[data-comment-filter]');
  if (commentFilter) {
    const map = commentFilter.closest('[data-comment-map]');
    if (!map) return true;

    map.dataset.commentMapFilter = commentFilter.dataset.commentFilter;
    map.querySelectorAll('[data-comment-filter]').forEach((button) => {
      const active = button.dataset.commentFilter === commentFilter.dataset.commentFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    refreshCommentMap(map);
    map
      .querySelector('[data-comment-list]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  if (event.target.closest('[data-open-tech]')) {
    const composer = document.getElementById('techComposer');
    if (composer) {
      composer.innerHTML = techResourceForm();
      composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }

  if (event.target.closest('[data-cancel-tech]')) {
    if (state.query.get('novo') || state.query.get('editar')) {
      goto('/oficina');
      return true;
    }
    const composer = document.getElementById('techComposer');
    if (composer) composer.replaceChildren();
    return true;
  }

  const deleteTech = event.target.closest('[data-delete-tech-resource]');
  if (deleteTech) {
    if (!confirm('Apagar definitivamente este conteúdo? Esta ação não pode ser desfeita.')) {
      return true;
    }
    const result = await api(
      `/api/tech-resources/${encodeURIComponent(deleteTech.dataset.deleteTechResource)}`,
      { method: 'DELETE' },
    );
    state.boot = null;
    await bootstrap();
    toast(result.message || 'Conteúdo apagado definitivamente.');
    await render();
    return true;
  }

  const deletePublication = event.target.closest('[data-delete-publication]');
  if (deletePublication) {
    if (!confirm('Apagar definitivamente esta publicação? Esta ação não pode ser desfeita.')) {
      return true;
    }
    const result = await api(
      `/api/publications/${encodeURIComponent(deletePublication.dataset.deletePublication)}`,
      { method: 'DELETE' },
    );
    state.boot = null;
    await bootstrap();
    toast(result.message || 'Publicação apagada definitivamente.');
    await render();
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

export function handleCommunityInput(event) {
  if (event.target.matches('[data-comment-search]')) {
    refreshCommentMap(event.target);
    return true;
  }

  if (event.target.matches('[data-reply-body]')) {
    refreshReplyQuality(event.target);
    return true;
  }

  return false;
}

export function handleCommunityChange(event) {
  if (!event.target.matches('[data-comment-order]')) return false;
  refreshCommentMap(event.target);
  return true;
}

export async function handleCommunitySubmit(event) {
  const form = event.target;

  if (form.matches('[data-tech-resource]')) {
    event.preventDefault();
    if (form.dataset.submitting === 'true') return true;
    form.dataset.submitting = 'true';
    const submitButton = form.querySelector('[type="submit"], button:not([type])');
    if (submitButton) submitButton.disabled = true;
    try {
      const resourceId = form.dataset.techResource;
      const endpoint = resourceId
        ? `/api/tech-resources/${encodeURIComponent(resourceId)}`
        : '/api/tech-resources';
      const data = await api(endpoint, {
        method: resourceId ? 'PATCH' : 'POST',
        body: JSON.stringify(formObj(form)),
      });
      state.boot = null;
      await bootstrap();
      toast(data.message || 'Enviado para revisão.');
      goto('/escrivaninha');
    } finally {
      form.dataset.submitting = 'false';
      if (submitButton) submitButton.disabled = false;
    }
    return true;
  }

  if (form.matches('[data-publication]')) {
    event.preventDefault();
    const publicationId = form.dataset.publication;
    const endpoint = publicationId
      ? `/api/publications/${encodeURIComponent(publicationId)}`
      : '/api/publications';
    const data = await api(endpoint, {
      method: publicationId ? 'PATCH' : 'POST',
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

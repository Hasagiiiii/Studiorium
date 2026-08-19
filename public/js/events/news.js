import { api, formObj, state, toast, E } from '../runtime.js';
import { goto, render } from '../router.js';
import { confirmAction, withBusyControl } from '../ui-feedback.js';

function sourceRow() {
  const index = document.querySelectorAll('[data-news-source]').length + 1;
  return `<div class="source-row" data-news-source>
    <span>${index}</span>
    <input class="field" name="sourceTitle" placeholder="Nome da fonte" />
    <input class="field" type="url" name="sourceUrl" placeholder="https://…" />
    <button class="soft" type="button" data-remove-source aria-label="Remover fonte">×</button>
  </div>`;
}

function articlePayload(form) {
  const values = formObj(form);
  const sources = [...form.querySelectorAll('[data-news-source]')]
    .map((row) => ({
      title: row.querySelector('[name=sourceTitle]').value,
      url: row.querySelector('[name=sourceUrl]').value,
    }))
    .filter((source) => source.title || source.url);
  return { ...values, sources };
}

export async function handleNewsClick(event) {
  const hypeButton = event.target.closest('[data-hype-news]');
  if (hypeButton) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    await withBusyControl(hypeButton, 'Registrando Hype…', async () => {
      const result = await api(`/api/news/${encodeURIComponent(hypeButton.dataset.hypeNews)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'hype' }),
      });
      hypeButton.textContent = `🔥 Hype registrado · ${Number(result.hypes || 0)}`;
      hypeButton.disabled = true;
      state.boot = null;
      toast(result.message || 'Hype registrado.');
    });
    return true;
  }

  if (event.target.closest('[data-add-source]')) {
    document.querySelector('[data-news-sources]')?.insertAdjacentHTML('beforeend', sourceRow());
    return true;
  }
  const removeSource = event.target.closest('[data-remove-source]');
  if (removeSource) {
    const rows = document.querySelectorAll('[data-news-source]');
    if (rows.length > 2) removeSource.closest('[data-news-source]').remove();
    else toast('Mantenha ao menos dois campos de fonte.', true);
    return true;
  }
  const submit = event.target.closest('[data-submit-news]');
  if (submit) {
    await withBusyControl(submit, 'Enviando…', async () => {
      await api(`/api/news/${encodeURIComponent(submit.dataset.submitNews)}/submit`, {
        method: 'POST',
        body: '{}',
      });
      toast('Notícia enviada para certificação editorial.');
      goto('/redacao');
    });
    return true;
  }

  for (const [attribute, endpoint, method, question, message] of [
    ['trashNews', '', 'DELETE', 'Mover esta notícia para a lixeira?', 'Notícia movida para a lixeira.'],
    ['restoreNews', '/restore', 'POST', '', 'Notícia restaurada.'],
    [
      'purgeNews',
      '/purge',
      'DELETE',
      'Excluir definitivamente? Esta ação não pode ser desfeita.',
      'Notícia excluída definitivamente.',
    ],
  ]) {
    const button = event.target.closest(
      `[data-${attribute.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`,
    );
    if (!button) continue;
    if (question) {
      const confirmed = await confirmAction(question, {
        title:
          method === 'DELETE' && endpoint === '/purge' ? 'Exclusão definitiva' : 'Confirmar ação',
        confirmLabel: endpoint === '/purge' ? 'Excluir definitivamente' : 'Confirmar',
        danger: method === 'DELETE',
      });
      if (!confirmed) return true;
    }
    await withBusyControl(button, method === 'DELETE' ? 'Excluindo…' : 'Restaurando…', async () => {
      const result = await api(
        `/api/news/${encodeURIComponent(button.dataset[attribute])}${endpoint}`,
        {
          method,
          body: method === 'POST' ? '{}' : undefined,
        },
      );
      toast(result.message || message);
      await render();
    });
    return true;
  }
  return false;
}

export async function handleNewsSubmit(event) {
  const form = event.target;
  if (form.matches('[data-news-contributor]')) {
    event.preventDefault();
    await api('/api/news/contributor', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    toast('Credenciamento enviado para análise.');
    await render();
    return true;
  }
  if (form.matches('[data-news-article]')) {
    event.preventDefault();
    const id = form.dataset.newsArticle;
    const result = await api(id ? `/api/news/${encodeURIComponent(id)}` : '/api/news', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(articlePayload(form)),
    });
    toast(result.message || 'Rascunho salvo.');
    state.boot = null;
    goto(`/redacao/${encodeURIComponent(result.article.id)}`);
    return true;
  }
  return false;
}

import { api, bootstrap, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';
import { withBusyControl } from '../ui-feedback.js';

async function refreshPage() {
  await bootstrap();
  await render();
}

function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function validForm(form) {
  if (!(form instanceof HTMLFormElement)) return false;
  if (form.checkValidity()) return true;
  form.reportValidity();
  return false;
}

export async function handleBookClick(event) {
  const create = event.target.closest('[data-book-create]');
  if (create) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const form = create.closest('[data-book-create-form]');
    if (!form || create.dataset.submitting === 'true') return true;
    if (!validForm(form)) return true;
    create.dataset.submitting = 'true';
    create.disabled = true;
    const original = create.textContent;
    create.textContent = 'Catalogando…';
    try {
      const body = formDataObject(form);
      body.action = 'create';
      body.recommend = form.querySelector('[name="recommend"]')?.checked !== false;
      const result = await api('/api/books/new/save', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast(result.message || 'Livro adicionado ao Armarium.');
      await bootstrap();
      goto(`/biblioteca?tipo=livros&q=${encodeURIComponent(body.title || '')}`);
    } finally {
      create.dataset.submitting = 'false';
      create.disabled = false;
      create.textContent = original;
    }
    return true;
  }

  const reviewOpen = event.target.closest('[data-book-review-open]');
  if (reviewOpen) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const panel = document.querySelector(
      `[data-book-review-form="${CSS.escape(reviewOpen.dataset.bookReviewOpen)}"]`,
    );
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) panel.querySelector('textarea')?.focus();
    }
    return true;
  }

  const reviewSave = event.target.closest('[data-book-review-save]');
  if (reviewSave) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const form = reviewSave.closest('[data-book-review-form]');
    if (!form || reviewSave.dataset.submitting === 'true') return true;
    if (!validForm(form)) return true;
    reviewSave.dataset.submitting = 'true';
    reviewSave.disabled = true;
    const original = reviewSave.textContent;
    reviewSave.textContent = 'Publicando…';
    try {
      const body = formDataObject(form);
      body.action = 'review';
      body.recommend = form.querySelector('[name="recommend"]')?.checked !== false;
      const id = form.dataset.bookReviewForm;
      const result = await api(`/api/books/${encodeURIComponent(id)}/save`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast(result.message || 'Review publicada.');
      await refreshPage();
    } finally {
      reviewSave.dataset.submitting = 'false';
      reviewSave.disabled = false;
      reviewSave.textContent = original;
    }
    return true;
  }

  const save = event.target.closest('[data-book-save]');
  if (save) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const [id, shelfStatus = 'want_to_read'] = save.dataset.bookSave.split(':');
    await withBusyControl(save, 'Atualizando…', async () => {
      const result = await api(`/api/books/${encodeURIComponent(id)}/save`, {
        method: 'POST',
        body: JSON.stringify({ action: 'shelf', shelfStatus }),
      });
      toast(result.message || 'Estante atualizada.');
      await refreshPage();
    });
    return true;
  }

  const remove = event.target.closest('[data-book-remove]');
  if (!remove) return false;
  await withBusyControl(remove, 'Removendo…', async () => {
    const result = await api(`/api/books/${encodeURIComponent(remove.dataset.bookRemove)}/save`, {
      method: 'DELETE',
      body: '{}',
    });
    toast(result.message || 'Livro removido da estante.');
    await render();
  });
  return true;
}

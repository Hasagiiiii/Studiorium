import { api, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

export async function handleBookClick(event) {
  const save = event.target.closest('[data-book-save]');
  if (save) {
    if (!state.me) {
      goto('/login');
      return true;
    }
    const [id, shelfStatus = 'want_to_read'] = save.dataset.bookSave.split(':');
    const result = await api(`/api/books/${encodeURIComponent(id)}/save`, {
      method: 'POST',
      body: JSON.stringify({ shelfStatus }),
    });
    toast(result.message || 'Livro guardado na estante.');
    return true;
  }
  const remove = event.target.closest('[data-book-remove]');
  if (!remove) return false;
  const result = await api(`/api/books/${encodeURIComponent(remove.dataset.bookRemove)}/save`, {
    method: 'DELETE',
    body: '{}',
  });
  toast(result.message || 'Livro removido da estante.');
  await render();
  return true;
}

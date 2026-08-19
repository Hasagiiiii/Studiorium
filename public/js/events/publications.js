import { api, state, toast } from '../runtime.js';
import { goto } from '../router.js';
import { withBusyControl } from '../ui-feedback.js';

export async function handlePublicationClick(event) {
  const button = event.target.closest('[data-publication-boost]');
  if (!button) return false;
  if (!state.me) {
    goto('/login');
    return true;
  }
  await withBusyControl(button, 'Impulsionando…', async () => {
    const id = button.dataset.publicationBoost;
    const result = await api(`/api/publications/${encodeURIComponent(id)}/boost`, {
      method: 'POST',
      body: '{}',
    });
    state.boot.publications
      .filter((publication) => publication.id === id)
      .forEach((publication) => (publication.boosts = result.boosts));
    document.querySelectorAll(`[data-boost-count="${CSS.escape(id)}"]`).forEach((element) => {
      element.textContent = String(result.boosts);
    });
    toast(result.message || 'Publicação impulsionada.');
  });
  return true;
}

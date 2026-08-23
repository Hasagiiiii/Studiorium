import { api, loadSocialGraph, toast } from '../runtime.js';
import { render } from '../router.js';

export async function handleSocialClick(event) {
  const button = event.target.closest('[data-profile-follow]');
  if (!button) return false;

  event.preventDefault();
  if (button.disabled) return true;

  const username = button.dataset.profileFollow;
  const following = button.dataset.following === 'true';
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = following ? 'Deixando de seguir…' : 'Seguindo…';

  try {
    await api(`/api/profiles/${encodeURIComponent(username)}/social`, {
      method: following ? 'DELETE' : 'POST',
    });
    await loadSocialGraph();
    toast(following ? 'Você deixou de seguir este perfil.' : 'Agora você segue este perfil.');
    await render();
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  return true;
}

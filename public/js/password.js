import { api, toast } from './runtime.js';

addEventListener('submit', async (event) => {
  const form = event.target;
  if (!form.matches('[data-change-password]')) return;
  event.preventDefault();

  const currentPassword = String(form.elements.currentPassword?.value || '');
  const newPassword = String(form.elements.newPassword?.value || '');
  if (newPassword.length < 12) {
    toast('A nova senha precisa ter pelo menos 12 caracteres.', true);
    return;
  }

  try {
    await api('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    form.reset();
    toast('Senha alterada. Outras sessões foram encerradas.');
  } catch (error) {
    toast(error.message, true);
  }
});

import { api, bootstrap, formObj, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

const PROFILE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PROFILE_IMAGE_LIMIT = 3 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

async function profileImagePayload(file) {
  if (!file || !PROFILE_IMAGE_TYPES.has(file.type)) {
    throw new Error('Use uma imagem JPG, PNG ou WebP.');
  }
  if (file.size > PROFILE_IMAGE_LIMIT) {
    throw new Error('A imagem precisa ter até 3 MB.');
  }
  return {
    name: file.name,
    mime: file.type,
    dataBase64: await fileToBase64(file),
  };
}

async function refreshAccount(message) {
  state.boot = null;
  await bootstrap();
  toast(message);
  await render();
}

export async function handleAccountSubmit(event) {
  const form = event.target;

  if (form.matches('[data-login]')) {
    event.preventDefault();
    await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    state.boot = null;
    await bootstrap();
    toast('Bem-vindo ao Studiorium.');
    goto('/escrivaninha');
    return true;
  }

  if (form.matches('[data-register]')) {
    event.preventDefault();
    if (form.dataset.submitting === 'true') return true;
    form.dataset.submitting = 'true';
    const button = form.querySelector('button[type="submit"], button:not([type])');
    const originalLabel = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Criando conta…';
    }
    const values = formObj(form);
    values.birthYear = Number(values.birthYear);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      state.boot = null;
      await bootstrap();
      toast('Conta criada com sucesso.');
      goto('/escrivaninha');
    } finally {
      form.dataset.submitting = 'false';
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
    return true;
  }

  if (form.matches('[data-password-reset]')) {
    event.preventDefault();
    const values = formObj(form);
    const rawToken = new URLSearchParams(location.hash.slice(1)).get('token') || '';

    if (!/^[a-f0-9]{64}$/.test(rawToken)) {
      toast('O link de redefinição é inválido.', true);
      return true;
    }
    if (values.newPassword !== values.confirmPassword) {
      toast('As senhas informadas não coincidem.', true);
      return true;
    }

    await api('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ token: rawToken, newPassword: values.newPassword }),
    });
    history.replaceState({}, '', '/login');
    state.me = null;
    if (state.boot) state.boot.user = null;
    await render();
    toast('Senha redefinida. Entre com a nova senha.');
    return true;
  }

  if (form.matches('[data-password-reset-request]')) {
    event.preventDefault();
    const health = await api('/api/health');
    if (health.emailDelivery !== 'configured') {
      toast(
        'A recuperação por e-mail está temporariamente indisponível. Nenhum link foi gerado.',
        true,
      );
      return true;
    }
    const result = await api('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    form.reset();
    toast(result.message);
    return true;
  }

  if (form.matches('[data-profile-media]')) {
    event.preventDefault();
    const kind = form.dataset.profileMedia;
    const action = event.submitter?.value || 'upload';
    if (action === 'remove') {
      const result = await api(`/api/profile/media/${encodeURIComponent(kind)}`, {
        method: 'DELETE',
      });
      await refreshAccount(result.message || 'Imagem removida.');
      return true;
    }

    const file = form.elements.image?.files?.[0];
    if (!file) {
      toast('Escolha uma imagem primeiro.', true);
      return true;
    }
    const result = await api('/api/profile/media', {
      method: 'POST',
      body: JSON.stringify({ kind, file: await profileImagePayload(file) }),
    });
    await refreshAccount(result.message || 'Imagem atualizada.');
    return true;
  }

  if (form.matches('[data-profile]')) {
    event.preventDefault();
    const values = formObj(form);
    values.isPublic = form.elements.isPublic ? form.elements.isPublic.checked : undefined;
    await api('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    await refreshAccount('Perfil atualizado.');
    return true;
  }

  if (form.matches('[data-profile-verification]')) {
    event.preventDefault();
    const result = await api('/api/profile/verification', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    await refreshAccount(result.message || 'Solicitação enviada.');
    return true;
  }

  return false;
}

import { api, bootstrap, formObj, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

const PROFILE_IMAGE_LIMIT = 3 * 1024 * 1024;
const PROFILE_IMAGE_SOURCE_LIMIT = 25 * 1024 * 1024;
const PROFILE_IMAGE_MAX_EDGE = 1800;
const PROFILE_IMAGE_QUALITY = 0.85;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari/iOS pode exigir o caminho via <img> para alguns formatos da câmera.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function optimizeProfileImage(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Escolha uma foto válida.');
  }
  if (file.size > PROFILE_IMAGE_SOURCE_LIMIT) {
    throw new Error('A foto original é muito grande. Escolha uma imagem de até 25 MB.');
  }

  let image;
  try {
    image = await decodeImage(file);
  } catch {
    throw new Error('Não foi possível abrir esta foto. No iPhone, tente compartilhar como JPEG.');
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, PROFILE_IMAGE_MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  image.close?.();

  let blob = await canvasToBlob(canvas, 'image/webp', PROFILE_IMAGE_QUALITY);
  let mime = 'image/webp';
  if (!blob) {
    blob = await canvasToBlob(canvas, 'image/jpeg', PROFILE_IMAGE_QUALITY);
    mime = 'image/jpeg';
  }
  if (!blob) throw new Error('Não foi possível otimizar a foto.');

  if (blob.size > PROFILE_IMAGE_LIMIT) {
    blob = await canvasToBlob(canvas, mime, 0.72);
  }
  if (!blob || blob.size > PROFILE_IMAGE_LIMIT) {
    throw new Error('A foto ainda ficou grande demais após a otimização.');
  }

  const extension = mime === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `perfil-${Date.now()}.${extension}`, { type: mime });
}

async function profileImagePayload(file) {
  const optimized = await optimizeProfileImage(file);
  return {
    name: optimized.name,
    mime: optimized.type,
    dataBase64: await fileToBase64(optimized),
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
    const button = event.submitter;
    const originalLabel = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Otimizando…';
    }
    try {
      const result = await api('/api/profile/media', {
        method: 'POST',
        body: JSON.stringify({ kind, file: await profileImagePayload(file) }),
      });
      await refreshAccount(result.message || 'Imagem atualizada.');
    } finally {
      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
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
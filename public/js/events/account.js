import { api, bootstrap, formObj, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

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
    const values = formObj(form);
    values.birthYear = Number(values.birthYear);
    await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    state.boot = null;
    await bootstrap();
    toast('Conta criada com sucesso.');
    goto('/escrivaninha');
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
    const result = await api('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify(formObj(form)),
    });
    form.reset();
    toast(result.message);
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
    state.boot = null;
    await bootstrap();
    toast('Perfil atualizado.');
    await render();
    return true;
  }

  return false;
}

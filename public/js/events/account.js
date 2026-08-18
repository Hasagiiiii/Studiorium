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

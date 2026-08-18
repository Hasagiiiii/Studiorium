import { api, state, toast } from '../runtime.js';
import { goto } from '../router.js';

export async function handleNavigationClick(event) {
  const link = event.target.closest('a[data-link]');

  if (link && link.origin === location.origin) {
    event.preventDefault();
    goto(link.pathname + link.search);
    return true;
  }

  if (event.target.closest('[data-menu]')) {
    document.getElementById('mobileMenu')?.classList.toggle('hidden');
    return true;
  }

  if (event.target.closest('[data-library-clear]')) {
    goto('/biblioteca');
    return true;
  }

  if (event.target.closest('[data-print]')) {
    window.print();
    return true;
  }

  const sectionButton = event.target.closest('[data-scroll-section]');

  if (sectionButton) {
    document
      .getElementById(sectionButton.dataset.scrollSection)
      ?.scrollIntoView({ behavior: 'smooth' });
    document.querySelectorAll('.sectionbtn').forEach((button) => button.classList.remove('active'));
    sectionButton.classList.add('active');
    return true;
  }

  if (event.target.closest('[data-logout]')) {
    await api('/api/auth/logout', {
      method: 'POST',
      body: '{}',
    });
    state.boot = null;
    state.me = null;
    toast('Sessão encerrada.');
    goto('/');
    return true;
  }

  return false;
}

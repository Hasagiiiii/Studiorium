import { api, state, toast } from '../runtime.js';
import { goto, render } from '../router.js';

function panel(open) {
  const element = document.querySelector('[data-notification-panel]');
  const trigger = document.querySelector('[data-notifications]');
  element?.classList.toggle('open', open);
  trigger?.setAttribute('aria-expanded', String(open));
}

export async function handleNotificationClick(event) {
  if (event.target.closest('[data-notifications]')) {
    const element = document.querySelector('[data-notification-panel]');
    panel(!element?.classList.contains('open'));
    return true;
  }
  if (event.target.closest('[data-notifications-close]')) {
    panel(false);
    return true;
  }
  if (event.target.closest('[data-notifications-read-all]')) {
    await api('/api/notifications/read-all', { method: 'PATCH', body: '{}' });
    state.notifications = state.notifications.map((item) => ({
      ...item,
      readAt: item.readAt || new Date().toISOString(),
    }));
    state.unreadNotificationCount = 0;
    await render();
    panel(true);
    toast('Notificações marcadas como lidas.');
    return true;
  }
  const item = event.target.closest('[data-notification-open]');
  if (!item) return false;
  const id = item.dataset.notificationOpen;
  const link = item.dataset.notificationLink;
  const current = state.notifications.find((notification) => notification.id === id);
  if (current && !current.readAt) {
    await api(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      body: '{}',
    });
    current.readAt = new Date().toISOString();
    state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
  }
  if (link.startsWith('/')) goto(link);
  else {
    await render();
    panel(true);
  }
  return true;
}

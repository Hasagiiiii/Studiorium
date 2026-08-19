export const app = document.getElementById('app');
export const toastEl = document.getElementById('toast');
export const state = {
  boot: null,
  me: null,
  route: '/',
  params: {},
  query: new URLSearchParams(location.search),
  mobile: false,
  notifications: [],
  unreadNotificationCount: 0,
};

export const E = (v = '') =>
  String(v).replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );
export const date = (v) =>
  v ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(v)) : '—';
export const num = (v) => new Intl.NumberFormat('pt-BR').format(Number(v || 0));
export const initials = (v) =>
  String(v || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();
export function html(strings, ...values) {
  return values.reduce(
    (output, value, index) => output + String(value ?? '') + strings[index + 1],
    strings[0],
  );
}
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
    r.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(file);
  });
}
export function toast(msg, error = false) {
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (error ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.className = 'toast'), 3300);
}

const RETRYABLE_GET_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function canRetry(method, status, attempt, maxAttempts) {
  if (method !== 'GET' || attempt >= maxAttempts) return false;
  return status === 0 || RETRYABLE_GET_STATUSES.has(status);
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const method = String(options.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 3 : 1;
  let lastError;

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response;

    try {
      response = await fetch(path, {
        ...options,
        headers,
        credentials: 'same-origin',
      });
    } catch (error) {
      lastError = error;
      if (!canRetry(method, 0, attempt, maxAttempts)) throw error;
      await wait(400 * attempt);
      continue;
    }

    if (response.status === 204) return {};
    const data = await response.json().catch(() => ({}));

    if (response.ok) return data;

    const error = new Error(data.error || 'Não foi possível concluir a ação.');
    error.status = response.status;
    lastError = error;

    if (!canRetry(method, response.status, attempt, maxAttempts)) throw error;
    await wait(400 * attempt);
  }

  throw lastError || new Error('Não foi possível concluir a ação.');
}
export async function bootstrap() {
  state.boot = await api('/api/bootstrap');
  state.me = state.boot.user;
  if (state.me) {
    try {
      await loadNotifications();
    } catch {
      state.notifications = [];
      state.unreadNotificationCount = 0;
    }
  } else {
    state.notifications = [];
    state.unreadNotificationCount = 0;
  }
}
export async function loadNotifications() {
  const data = await api('/api/notifications');
  state.notifications = data.notifications || [];
  state.unreadNotificationCount = Number(data.unreadCount || 0);
  return data;
}
export function formObj(form) {
  return Object.fromEntries(new FormData(form).entries());
}

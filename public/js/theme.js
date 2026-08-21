const STORAGE_KEY = 'studiorium-theme';
const THEMES = ['system', 'dark', 'light'];

function preferredTheme() {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function savedTheme() {
  const value = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(value) ? value : 'system';
}

function resolvedTheme(value) {
  return value === 'system' ? preferredTheme() : value;
}

function applyTheme(value) {
  const choice = THEMES.includes(value) ? value : 'system';
  const resolved = resolvedTheme(choice);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = choice;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'light' ? '#e9e4d9' : '#111512');
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice));
  });
}

function renderSwitcher() {
  if (document.querySelector('.theme-switcher')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'theme-switcher';
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', 'Aparência');
  wrapper.innerHTML = `
    <button type="button" data-theme-choice="system" title="Usar tema do sistema" aria-label="Tema do sistema">◐</button>
    <button type="button" data-theme-choice="dark" title="Tema escuro" aria-label="Tema escuro">☾</button>
    <button type="button" data-theme-choice="light" title="Tema claro suave" aria-label="Tema claro suave">☼</button>`;

  wrapper.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-choice]');
    if (!button) return;
    localStorage.setItem(STORAGE_KEY, button.dataset.themeChoice);
    applyTheme(button.dataset.themeChoice);
  });

  document.body.append(wrapper);
  applyTheme(savedTheme());
}

export function installThemeSystem() {
  applyTheme(savedTheme());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSwitcher, { once: true });
  } else {
    renderSwitcher();
  }

  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (savedTheme() === 'system') applyTheme('system');
  });
}

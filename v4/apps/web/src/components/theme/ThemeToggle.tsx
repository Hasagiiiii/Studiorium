import { useEffect, useLayoutEffect, useState } from 'react';

const STORAGE_KEY = 'lorion-theme';
type Theme = 'dark' | 'light';

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function storedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? systemTheme());
  const hasStoredPreference = storedTheme() !== null;

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasStoredPreference) return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => setTheme(media.matches ? 'light' : 'dark');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [hasStoredPreference]);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  const light = theme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={light ? 'Ativar tema escuro' : 'Ativar tema claro'}
      aria-pressed={light}
      title={light ? 'Tema claro ativo' : 'Tema escuro ativo'}
      onClick={toggleTheme}
    >
      <span aria-hidden="true">{light ? '☼' : '☾'}</span>
      <span className="theme-toggle-label">{light ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}

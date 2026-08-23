import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { PrimaryNav } from '../../components/navigation/PrimaryNav.js';
import { useAppState } from '../state/useAppState.js';

export function AppShell({ children }: PropsWithChildren) {
  const { data } = useAppState();
  const me = data?.user;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Lorion — início">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span>
            <strong>Lorion</strong>
            <small>by Orium Labs</small>
          </span>
        </Link>
        <PrimaryNav />
        <div className="topbar-actions">
          <Link to="/buscar" aria-label="Pesquisar">⌕</Link>
          {me ? <Link to="/notificacoes" aria-label="Notificações">◇</Link> : null}
          {me?.username ? (
            <Link to={`/perfil/${encodeURIComponent(me.username)}`}>{me.displayName}</Link>
          ) : (
            <Link to="/entrar">Entrar</Link>
          )}
        </div>
      </header>
      <div className="shell-body">{children}</div>
      <nav className="bottom-nav" aria-label="Navegação móvel">
        <Link to="/">Início</Link>
        <Link to="/explorar">Explorar</Link>
        <Link className="create-action" to="/criar" aria-label="Criar">+</Link>
        <Link to="/comunidades">Comunidades</Link>
        <Link to={me?.username ? `/perfil/${encodeURIComponent(me.username)}` : '/entrar'}>
          Perfil
        </Link>
      </nav>
    </div>
  );
}

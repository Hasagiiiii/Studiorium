import { useState, type PropsWithChildren } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateLauncher } from '../../components/create/CreateLauncher.js';
import { PrimaryNav } from '../../components/navigation/PrimaryNav.js';
import { services } from '../services/services.js';
import { useAppState } from '../state/useAppState.js';

export function AppShell({ children }: PropsWithChildren) {
  const { data, reload } = useAppState();
  const navigate = useNavigate();
  const me = data?.user;
  const [createOpen, setCreateOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await services.auth.logout();
      await reload();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Lorion — início">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>
            <strong>Lorion</strong>
            <small>by Orium Labs</small>
          </span>
        </Link>
        <PrimaryNav />
        <div className="topbar-actions">
          <Link to="/explorar?foco=busca" aria-label="Pesquisar">
            ⌕
          </Link>
          {me ? (
            <Link to="/notificacoes" aria-label="Notificações">
              ◇
            </Link>
          ) : null}
          {me?.username ? (
            <>
              <Link to={`/perfil/${encodeURIComponent(me.username)}`}>{me.displayName}</Link>
              <button
                className="topbar-logout"
                type="button"
                disabled={loggingOut}
                onClick={() => void logout()}
              >
                {loggingOut ? 'Saindo…' : 'Sair'}
              </button>
            </>
          ) : (
            <Link to="/entrar">Entrar</Link>
          )}
        </div>
      </header>
      <div className="shell-body">{children}</div>
      <nav className="bottom-nav" aria-label="Navegação móvel">
        <Link to="/">Início</Link>
        <Link to="/explorar">Explorar</Link>
        <button
          className="create-action"
          type="button"
          aria-label="Criar"
          aria-haspopup="dialog"
          aria-expanded={createOpen}
          onClick={() => setCreateOpen(true)}
        >
          +
        </button>
        <Link to="/comunidades">Comunidades</Link>
        <Link to={me?.username ? `/perfil/${encodeURIComponent(me.username)}` : '/entrar'}>
          Perfil
        </Link>
      </nav>
      <CreateLauncher open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

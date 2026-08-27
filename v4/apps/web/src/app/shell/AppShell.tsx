import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreateLauncher } from '../../components/create/CreateLauncher.js';
import { useToast } from '../../components/feedback/toasts/ToastProvider.js';
import { PrimaryNav } from '../../components/navigation/PrimaryNav.js';
import { services } from '../services/services.js';
import { useAppState } from '../state/useAppState.js';

const CREATE_RETURN_PATH = '/';

export function AppShell({ children }: PropsWithChildren) {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const me = data?.user;
  const [createOpen, setCreateOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = lastScrollY.current;
    lastScrollY.current = current;

    if (reduceMotion || !window.matchMedia('(max-width: 880px)').matches) {
      setHeaderVisible(true);
      return;
    }

    const delta = current - previous;
    if (current < 72 || delta < -5) setHeaderVisible(true);
    else if (delta > 5) setHeaderVisible(false);
  });

  useEffect(() => {
    setHeaderVisible(true);
    setCreateOpen(false);
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  function toggleCreate() {
    if (!me) {
      pushToast({ message: 'Entre na sua conta para criar conteúdo.', tone: 'info' });
      navigate(`/entrar?retorno=${encodeURIComponent(CREATE_RETURN_PATH)}`);
      return;
    }
    setCreateOpen((value) => !value);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await services.auth.logout();
      await reload();
      navigate('/');
      pushToast({ message: 'Sessão encerrada.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível encerrar a sessão.',
        tone: 'error',
      });
    } finally {
      setLoggingOut(false);
    }
  }

  const showHeader = headerVisible || Boolean(me && createOpen);

  return (
    <div className="app-shell">
      <motion.header
        className="topbar"
        animate={{ y: showHeader ? 0 : '-115%' }}
        transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: 'easeOut' }}
        onFocusCapture={() => setHeaderVisible(true)}
      >
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
          <motion.button
            className="topbar-create"
            type="button"
            aria-label={me ? 'Criar' : 'Entrar para criar'}
            aria-haspopup={me ? 'dialog' : undefined}
            aria-expanded={me ? createOpen : undefined}
            animate={{ rotate: createOpen && me && !reduceMotion ? 45 : 0 }}
            whileTap={{ scale: reduceMotion ? 1 : 0.92 }}
            onClick={toggleCreate}
          >
            +
          </motion.button>
          <Link to="/explorar?foco=busca" aria-label="Pesquisar">
            ⌕
          </Link>
          {me ? (
            <>
              <Link to="/notificacoes" aria-label="Notificações">
                ◇
              </Link>
              <Link to="/escrivaninha">Escrivaninha</Link>
            </>
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
      </motion.header>
      <div className="shell-body">{children}</div>
      <nav className="bottom-nav" aria-label="Navegação móvel">
        <Link to="/">Início</Link>
        <Link to="/explorar">Explorar</Link>
        <motion.button
          className="create-action"
          type="button"
          aria-label={me ? 'Criar' : 'Entrar para criar'}
          aria-haspopup={me ? 'dialog' : undefined}
          aria-expanded={me ? createOpen : undefined}
          animate={{
            rotate: createOpen && me && !reduceMotion ? 45 : 0,
            scale: createOpen && me ? 1.06 : 1,
          }}
          whileTap={{ scale: reduceMotion ? 1 : 0.92 }}
          onClick={toggleCreate}
        >
          +
        </motion.button>
        <Link to="/comunidades">Comunidades</Link>
        <Link to={me ? '/escrivaninha' : '/entrar'}>{me ? 'Mesa' : 'Entrar'}</Link>
      </nav>
      {me ? <CreateLauncher open={createOpen} onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}

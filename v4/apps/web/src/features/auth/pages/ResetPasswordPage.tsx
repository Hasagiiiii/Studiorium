import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { AuthSurface } from '../components/AuthSurface.js';

function tokenFromHash(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token')?.trim() || '';
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { reload } = useAppState();
  const { pushToast } = useToast();
  const [token] = useState(tokenFromHash);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;

    if (!token) {
      setStatus('error');
      setError('O link de redefinição está ausente ou inválido.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setError('As senhas informadas não coincidem.');
      return;
    }

    setStatus('saving');
    setError('');
    try {
      await services.auth.resetPassword(token, password);
      await reload();
      pushToast({
        message: 'Senha redefinida. Entre novamente com a nova senha.',
        tone: 'success',
      });
      navigate('/entrar', { replace: true });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível redefinir a senha.';
      setStatus('error');
      setError(message);
      pushToast({ message, tone: 'error' });
    }
  }

  return (
    <AuthSurface
      eyebrow="Segurança da conta"
      title="Crie uma nova senha"
      description="O link é de uso único. Ao concluir, as sessões anteriores serão encerradas para proteger sua conta."
      note={
        <p>
          Precisa de outro link? <Link to="/esqueci-a-senha">Solicitar novamente</Link>
        </p>
      }
    >
      {!token ? (
        <div className="auth-form">
          <p className="inline-error" role="alert">
            O link de redefinição está ausente ou inválido.
          </p>
          <Link className="button primary" to="/esqueci-a-senha">
            Solicitar um novo link
          </Link>
        </div>
      ) : (
        <form
          className="auth-form"
          onSubmit={submit}
          aria-busy={status === 'saving' ? 'true' : 'false'}
        >
          <label>
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <p className="auth-form__hint">Use pelo menos 12 caracteres e evite reutilizar senhas.</p>
          {status === 'error' ? (
            <p className="inline-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button primary" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Redefinindo…' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </AuthSurface>
  );
}

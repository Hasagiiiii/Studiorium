import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { AuthSurface } from '../components/AuthSurface.js';

function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  const returnTo = safeReturnPath(searchParams.get('retorno'));

  if (data?.user) return <Navigate to={returnTo} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;
    setStatus('saving');
    setError('');
    try {
      await services.auth.login(email.trim(), password);
      await reload();
      pushToast({ message: 'Login realizado com sucesso.', tone: 'success' });
      navigate(returnTo, { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível entrar.';
      setStatus('error');
      setError(message);
      pushToast({ message, tone: 'error' });
    }
  }

  return (
    <AuthSurface
      eyebrow="Sua conta"
      title="Entre e retome de onde parou."
      description="Acesse seu perfil, comunidades e publicações com uma entrada direta e sem distrações."
      note="Sua senha nunca é exibida publicamente e o e-mail permanece privado."
    >
      <form className="auth-form" onSubmit={submit} aria-busy={status === 'saving'}>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {data?.capabilities.passwordResetAvailable ? (
          <p>
            <Link to="/esqueci-a-senha">Esqueci minha senha</Link>
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="inline-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Entrando…' : 'Entrar'}
        </button>
        <p>
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </AuthSurface>
  );
}

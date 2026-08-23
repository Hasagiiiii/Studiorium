import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { reload } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;
    setStatus('saving');
    setError('');
    try {
      await services.auth.login(email.trim(), password);
      await reload();
      navigate('/');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    }
  }

  return (
    <FeaturePage
      eyebrow="Conta"
      title="Entrar no Lorion"
      description="Acesse seu perfil, comunidades, projetos e conexões."
    >
      <form className="auth-form" onSubmit={submit}>
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
    </FeaturePage>
  );
}

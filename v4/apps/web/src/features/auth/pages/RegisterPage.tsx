import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  if (data?.user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;
    setStatus('saving');
    setError('');
    try {
      await services.auth.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        birthYear: Number(birthYear),
      });
      await reload();
      pushToast({ message: 'Conta criada com sucesso.', tone: 'success' });
      navigate('/', { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível criar a conta.';
      setStatus('error');
      setError(message);
      pushToast({ message, tone: 'error' });
    }
  }

  return (
    <FeaturePage
      eyebrow="Conta"
      title="Criar conta"
      description="Entre no Lorion para participar das comunidades e construir seu perfil de conhecimento."
    >
      <form className="auth-form" onSubmit={submit}>
        <label>
          Nome de exibição
          <input
            required
            minLength={2}
            maxLength={80}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
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
          Ano de nascimento
          <input
            type="number"
            inputMode="numeric"
            required
            min={1930}
            max={new Date().getFullYear()}
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
          />
        </label>
        <label>
          Senha
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
        {status === 'error' ? (
          <p className="inline-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Criando…' : 'Criar conta'}
        </button>
        <p>
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </FeaturePage>
  );
}

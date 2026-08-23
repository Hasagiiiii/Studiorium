import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function RequestPasswordResetPage() {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (data?.user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;

    setStatus('saving');
    setMessage('');
    try {
      const result = await services.auth.requestPasswordReset(email.trim());
      const nextMessage =
        result.message ||
        'Se a conta existir, enviaremos um link de redefinição para o e-mail informado.';
      setStatus('success');
      setMessage(nextMessage);
      pushToast({ message: 'Solicitação registrada.', tone: 'success' });
    } catch (cause) {
      const nextMessage =
        cause instanceof Error ? cause.message : 'Não foi possível solicitar a redefinição.';
      setStatus('error');
      setMessage(nextMessage);
      pushToast({ message: nextMessage, tone: 'error' });
    }
  }

  return (
    <FeaturePage
      eyebrow="Segurança"
      title="Recuperar senha"
      description="Informe o e-mail da sua conta. Se ela existir, enviaremos um link de uso único."
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
        {status === 'success' ? (
          <p role="status">{message}</p>
        ) : status === 'error' ? (
          <p className="inline-error" role="alert">
            {message}
          </p>
        ) : null}
        <button className="button primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Enviando…' : 'Enviar link de redefinição'}
        </button>
        <p>
          <Link to="/entrar">Voltar para entrar</Link>
        </p>
      </form>
    </FeaturePage>
  );
}

import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function AccountSecurityPage() {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!data?.user) {
    return <Navigate to="/entrar?retorno=%2Fconta%2Fseguranca" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('As novas senhas não coincidem.');
      return;
    }

    setStatus('saving');
    setMessage('');
    try {
      await services.auth.changePassword(currentPassword, newPassword);
      await reload();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('success');
      setMessage('Senha alterada. As outras sessões da sua conta foram encerradas.');
      pushToast({ message: 'Senha alterada com segurança.', tone: 'success' });
    } catch (cause) {
      const nextMessage = cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.';
      setStatus('error');
      setMessage(nextMessage);
      pushToast({ message: nextMessage, tone: 'error' });
    }
  }

  return (
    <FeaturePage
      eyebrow="Conta"
      title="Segurança da conta"
      description="Altere sua senha confirmando a senha atual. As demais sessões serão encerradas."
    >
      <form className="auth-form" onSubmit={submit}>
        <label>
          Senha atual
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
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
        {status === 'success' ? (
          <p role="status">{message}</p>
        ) : status === 'error' ? (
          <p className="inline-error" role="alert">
            {message}
          </p>
        ) : null}
        <button className="button primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Alterando…' : 'Alterar senha'}
        </button>
        {data.user.username ? (
          <p>
            <Link to={`/perfil/${encodeURIComponent(data.user.username)}`}>Voltar ao perfil</Link>
          </p>
        ) : null}
      </form>
    </FeaturePage>
  );
}

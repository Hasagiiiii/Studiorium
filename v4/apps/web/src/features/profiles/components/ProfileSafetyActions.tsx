import { useState, type FormEvent } from 'react';
import type { ProfileSafetyState, ReportCategory } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

const REPORT_CATEGORIES: Array<{ value: ReportCategory; label: string }> = [
  { value: 'odio', label: 'Discurso de ódio' },
  { value: 'racismo', label: 'Racismo' },
  { value: 'xenofobia', label: 'Xenofobia' },
  { value: 'sexismo', label: 'Sexismo' },
  { value: 'machismo', label: 'Machismo' },
  { value: 'assedio', label: 'Assédio' },
  { value: 'bullying', label: 'Bullying' },
  { value: 'conteudo_sexual', label: 'Conteúdo sexual inadequado' },
  { value: 'risco_menor', label: 'Risco para criança ou adolescente' },
  { value: 'dados_pessoais', label: 'Exposição de dados pessoais' },
  { value: 'plagio', label: 'Plágio' },
  { value: 'spam', label: 'Spam' },
  { value: 'golpe', label: 'Golpe / fraude' },
  { value: 'violencia', label: 'Violência' },
  { value: 'outro', label: 'Outro' },
];

type Props = {
  username: string;
  userId: string;
  state: ProfileSafetyState;
  onChanged(): Promise<void> | void;
};

export function ProfileSafetyActions({ username, userId, state, onChanged }: Props) {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<'block' | 'mute' | 'report' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('outro');
  const [description, setDescription] = useState('');

  if (!data?.user) return null;

  async function toggle(kind: 'block' | 'mute', enabled: boolean) {
    if (busy) return;
    setBusy(kind);
    try {
      await services.moderation.setProfileControl(username, kind, enabled);
      pushToast({
        message:
          kind === 'block'
            ? enabled
              ? `@${username} foi bloqueado.`
              : `@${username} foi desbloqueado.`
            : enabled
              ? `@${username} foi silenciado.`
              : `@${username} deixou de ser silenciado.`,
        tone: 'success',
      });
      await onChanged();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível atualizar esse controle.',
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy('report');
    try {
      await services.moderation.report({
        targetType: 'profile',
        targetId: userId,
        category,
        description,
      });
      setReportOpen(false);
      setDescription('');
      setCategory('outro');
      pushToast({ message: 'Denúncia enviada para análise.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível enviar a denúncia.',
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="profile-safety-actions" aria-label="Segurança do perfil">
      <div className="form-actions">
        <button
          className="button secondary"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void toggle('mute', !state.muted)}
        >
          {state.muted ? 'Parar de silenciar' : 'Silenciar'}
        </button>
        <button
          className={state.blocked ? 'button secondary' : 'button danger'}
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void toggle('block', !state.blocked)}
        >
          {state.blocked ? 'Desbloquear' : 'Bloquear'}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => setReportOpen((value) => !value)}
        >
          Denunciar
        </button>
      </div>

      {state.blocked ? (
        <p className="create-launcher-note">
          Este perfil está bloqueado. A conexão de follow foi removida e o conteúdo foi ocultado.
        </p>
      ) : null}

      {reportOpen ? (
        <form className="auth-form profile-report-form" onSubmit={submitReport}>
          <label>
            Motivo
            <select value={category} onChange={(event) => setCategory(event.target.value as ReportCategory)}>
              {REPORT_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contexto adicional
            <textarea
              maxLength={1500}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="button primary" type="submit" disabled={busy === 'report'}>
              {busy === 'report' ? 'Enviando…' : 'Enviar denúncia'}
            </button>
            <button className="button secondary" type="button" onClick={() => setReportOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

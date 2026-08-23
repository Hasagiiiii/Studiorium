import { useMemo, useState, type FormEvent } from 'react';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  onCancel(): void;
  onCreated(): void;
};

export function PostComposer({ onCancel, onCreated }: Props) {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const communities = useMemo(
    () =>
      (data?.communities || []).filter(
        (community) =>
          community.joined &&
          community.membershipStatus === 'active' &&
          community.memberModerationStatus === 'clear',
      ),
    [data?.communities],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await services.posts.create({
        title: title.trim(),
        body: body.trim(),
        communitySlug: communitySlug || null,
      });
      await reload();
      pushToast({ message: 'Publicação criada.', tone: 'success' });
      onCreated();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível publicar.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form post-composer" onSubmit={submit}>
      <div>
        <span className="eyebrow">Publicação</span>
        <h3>Compartilhe uma atualização</h3>
      </div>

      <label>
        Título opcional
        <input
          maxLength={160}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Dê um título curto quando ajudar"
        />
      </label>

      <label>
        Texto
        <textarea
          required
          minLength={1}
          maxLength={4000}
          rows={7}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="O que você quer compartilhar?"
        />
        <small>{body.length}/4000</small>
      </label>

      <label>
        Comunidade opcional
        <select value={communitySlug} onChange={(event) => setCommunitySlug(event.target.value)}>
          <option value="">Publicar no meu perfil e feed geral</option>
          {communities.map((community) => (
            <option key={community.id} value={community.slug}>
              {community.name}
            </option>
          ))}
        </select>
      </label>

      {communitySlug ? (
        <p className="feed-status">
          A visibilidade será definida pelas regras da comunidade escolhida.
        </p>
      ) : null}

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="button secondary" type="button" disabled={submitting} onClick={onCancel}>
          Voltar
        </button>
        <button className="button primary" type="submit" disabled={submitting || !body.trim()}>
          {submitting ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}

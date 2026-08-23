import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CommunityHub as CommunityHubData } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  slug: string;
  canAccess: boolean;
};

export function CommunityHub({ slug, canAccess }: Props) {
  const { pushToast } = useToast();
  const [hub, setHub] = useState<CommunityHubData | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Geral');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!canAccess) {
      setHub(null);
      setStatus('idle');
      setError('');
      return;
    }

    let active = true;
    setStatus('loading');
    setError('');
    void services.communities
      .hub(slug)
      .then((value) => {
        if (!active) return;
        setHub(value);
        setStatus('ready');
      })
      .catch((cause) => {
        if (!active) return;
        setStatus('error');
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar a comunidade.',
        );
      });

    return () => {
      active = false;
    };
  }, [canAccess, slug]);

  if (!canAccess) return null;

  async function submitDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating || !hub?.canCreateDiscussion) return;
    setCreating(true);
    setError('');
    try {
      const discussion = await services.communities.createDiscussion(slug, {
        title: title.trim(),
        body: body.trim(),
        category: category.trim() || 'Geral',
      });
      setHub((current) =>
        current ? { ...current, discussions: [discussion, ...current.discussions] } : current,
      );
      setTitle('');
      setBody('');
      setCategory('Geral');
      pushToast({ message: 'Discussão publicada na comunidade.', tone: 'success' });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível publicar.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="community-hub">
      <h2>Espaço da comunidade</h2>
      {status === 'loading' ? <p>Carregando membros e discussões…</p> : null}
      {status === 'error' ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      {hub ? (
        <>
          {hub.canCreateDiscussion ? (
            <form className="auth-form community-discussion-form" onSubmit={submitDiscussion}>
              <h3>Nova discussão</h3>
              <label>
                Título
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                Categoria
                <input
                  maxLength={60}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </label>
              <label>
                Texto
                <textarea
                  required
                  minLength={1}
                  maxLength={8000}
                  rows={6}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
              <button className="button primary" type="submit" disabled={creating}>
                {creating ? 'Publicando…' : 'Publicar discussão'}
              </button>
            </form>
          ) : null}

          <div className="community-discussions">
            <h3>Discussões</h3>
            {hub.discussions.length ? (
              <ul>
                {hub.discussions.map((discussion) => (
                  <li key={discussion.id}>
                    <Link to={`/discussoes/${encodeURIComponent(discussion.id)}`}>
                      {discussion.title}
                    </Link>
                    <span> por {discussion.authorName}</span>
                    {discussion.category ? <span> · {discussion.category}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ainda não há discussões nesta comunidade.</p>
            )}
          </div>

          <div className="community-members">
            <h3>Membros</h3>
            {hub.members.length ? (
              <ul>
                {hub.members.map((member) => (
                  <li key={member.userId}>
                    {member.username ? (
                      <Link to={`/perfil/${encodeURIComponent(member.username)}`}>
                        {member.displayName}
                      </Link>
                    ) : (
                      <span>{member.displayName}</span>
                    )}
                    <span> · {member.role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>A comunidade ainda não possui membros ativos.</p>
            )}
          </div>

          {error && status !== 'error' ? (
            <p className="inline-error" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

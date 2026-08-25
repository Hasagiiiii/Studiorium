import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ContentInteractionSummary } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  contentId: string;
  initial: ContentInteractionSummary;
  compact?: boolean;
};

export function PostActionBar({ contentId, initial, compact = false }: Props) {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [summary, setSummary] = useState(initial);
  const [liking, setLiking] = useState(false);
  const postPath = `/publicacoes/${encodeURIComponent(contentId)}`;

  async function toggleLike() {
    if (!data?.user) return;
    if (liking) return;
    setLiking(true);
    try {
      const result = summary.viewerLiked
        ? await services.interactions.unlike(contentId)
        : await services.interactions.like(contentId);
      setSummary((current) => ({
        ...current,
        viewerLiked: result.liked,
        likeCount: result.likeCount,
      }));
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível atualizar a curtida.',
        tone: 'error',
      });
    } finally {
      setLiking(false);
    }
  }

  async function share() {
    const url = new URL(postPath, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Publicação no Lorion', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      pushToast({ message: 'Link copiado.', tone: 'success' });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      pushToast({ message: 'Não foi possível compartilhar esta publicação.', tone: 'error' });
    }
  }

  return (
    <div className={compact ? 'post-action-bar is-compact' : 'post-action-bar'} aria-label="Ações da publicação">
      {data?.user ? (
        <button
          type="button"
          className={summary.viewerLiked ? 'post-action is-active' : 'post-action'}
          aria-pressed={summary.viewerLiked}
          disabled={liking || !summary.canInteract}
          onClick={() => void toggleLike()}
        >
          <span aria-hidden="true">♡</span>
          <span>{summary.likeCount || 'Curtir'}</span>
        </button>
      ) : (
        <Link className="post-action" to={`/entrar?retorno=${encodeURIComponent(postPath)}`}>
          <span aria-hidden="true">♡</span>
          <span>{summary.likeCount || 'Curtir'}</span>
        </Link>
      )}

      <Link className="post-action" to={`${postPath}#comentarios`}>
        <span aria-hidden="true">◯</span>
        <span>{summary.commentCount || 'Comentar'}</span>
      </Link>

      <button className="post-action" type="button" onClick={() => void share()}>
        <span aria-hidden="true">↗</span>
        <span>Compartilhar</span>
      </button>
    </div>
  );
}

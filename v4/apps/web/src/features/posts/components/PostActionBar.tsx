import { useState, type ReactNode } from 'react';
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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="post-action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <Icon>
      <path
        fill={filled ? 'currentColor' : 'none'}
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
      />
    </Icon>
  );
}

function CommentIcon() {
  return (
    <Icon>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </Icon>
  );
}

function ShareIcon() {
  return (
    <Icon>
      <path d="M12 16V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </Icon>
  );
}

export function PostActionBar({ contentId, initial, compact = false }: Props) {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [summary, setSummary] = useState(initial);
  const [liking, setLiking] = useState(false);
  const postPath = `/publicacoes/${encodeURIComponent(contentId)}`;

  async function toggleLike() {
    if (!data?.user || liking) return;
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
        await navigator.share({ title: 'Publicação no Studiorium', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      pushToast({ message: 'Link copiado.', tone: 'success' });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      pushToast({ message: 'Não foi possível compartilhar esta publicação.', tone: 'error' });
    }
  }

  const likeLabel = summary.likeCount
    ? `${summary.likeCount} ${summary.likeCount === 1 ? 'curtida' : 'curtidas'}`
    : 'Curtir';
  const commentLabel = summary.commentCount
    ? `${summary.commentCount} ${summary.commentCount === 1 ? 'comentário' : 'comentários'}`
    : 'Comentar';

  return (
    <div
      className={compact ? 'post-action-bar is-compact' : 'post-action-bar'}
      aria-label="Ações da publicação"
    >
      {data?.user ? (
        <button
          type="button"
          className={summary.viewerLiked ? 'post-action is-active' : 'post-action'}
          aria-pressed={summary.viewerLiked}
          aria-label={likeLabel}
          disabled={liking || !summary.canInteract}
          onClick={() => void toggleLike()}
        >
          <HeartIcon filled={summary.viewerLiked} />
          <span>{summary.likeCount || 'Curtir'}</span>
        </button>
      ) : (
        <Link
          className="post-action"
          aria-label={likeLabel}
          to={`/entrar?retorno=${encodeURIComponent(postPath)}`}
        >
          <HeartIcon filled={false} />
          <span>{summary.likeCount || 'Curtir'}</span>
        </Link>
      )}

      <Link className="post-action" aria-label={commentLabel} to={`${postPath}#comentarios`}>
        <CommentIcon />
        <span>{summary.commentCount || 'Comentar'}</span>
      </Link>

      <button
        className="post-action"
        type="button"
        aria-label="Compartilhar publicação"
        onClick={() => void share()}
      >
        <ShareIcon />
        <span>Compartilhar</span>
      </button>
    </div>
  );
}

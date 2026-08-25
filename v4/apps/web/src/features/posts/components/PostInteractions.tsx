import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ContentComment, ContentInteractions } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  contentId: string;
  initial: ContentInteractions;
};

function commentTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function initialOf(comment: ContentComment): string {
  return (comment.authorName.trim().charAt(0) || comment.authorUsername.trim().charAt(0) || '?').toUpperCase();
}

export function PostInteractions({ contentId, initial }: Props) {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [interactions, setInteractions] = useState(initial);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setInteractions(initial);
    setCommentBody('');
    setReplyTo(null);
    setEditingId(null);
    setEditingBody('');
  }, [contentId, initial]);

  const commentById = useMemo(
    () => new Map(interactions.comments.map((comment) => [comment.id, comment])),
    [interactions.comments],
  );

  const childrenByParent = useMemo(() => {
    const children = new Map<string, ContentComment[]>();
    for (const comment of interactions.comments) {
      if (!comment.parentId || !commentById.has(comment.parentId)) continue;
      children.set(comment.parentId, [...(children.get(comment.parentId) || []), comment]);
    }
    return children;
  }, [commentById, interactions.comments]);

  const rootComments = useMemo(
    () => interactions.comments.filter((comment) => !comment.parentId || !commentById.has(comment.parentId)),
    [commentById, interactions.comments],
  );

  const returnPath = `/publicacoes/${encodeURIComponent(contentId)}#comentarios`;

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentBody.trim();
    if (!data?.user || commenting || !body) return;
    setCommenting(true);
    try {
      const result = await services.interactions.comment(contentId, {
        body,
        parentId: replyTo,
      });
      setInteractions((current) => ({
        ...current,
        commentCount: result.commentCount,
        comments: [...current.comments, result.comment],
      }));
      setCommentBody('');
      setReplyTo(null);
      pushToast({
        message: replyTo ? 'Resposta publicada.' : 'Comentário publicado.',
        tone: 'success',
      });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível publicar o comentário.',
        tone: 'error',
      });
    } finally {
      setCommenting(false);
    }
  }

  async function saveComment(commentId: string) {
    if (!editingBody.trim() || savingComment) return;
    setSavingComment(true);
    try {
      const result = await services.interactions.updateComment(contentId, commentId, {
        body: editingBody.trim(),
      });
      setInteractions((current) => ({
        ...current,
        commentCount: result.commentCount,
        comments: current.comments.map((comment) => comment.id === commentId ? result.comment : comment),
      }));
      setEditingId(null);
      setEditingBody('');
      pushToast({ message: 'Comentário atualizado.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível editar o comentário.',
        tone: 'error',
      });
    } finally {
      setSavingComment(false);
    }
  }

  async function removeComment(commentId: string) {
    if (deletingCommentId) return;
    setDeletingCommentId(commentId);
    try {
      const result = await services.interactions.deleteComment(contentId, commentId);
      setInteractions((current) => ({
        ...current,
        commentCount: result.commentCount,
        comments: current.comments.filter((comment) => comment.id !== result.commentId),
      }));
      if (replyTo === commentId) setReplyTo(null);
      if (editingId === commentId) {
        setEditingId(null);
        setEditingBody('');
      }
      pushToast({ message: 'Comentário excluído.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível excluir o comentário.',
        tone: 'error',
      });
    } finally {
      setDeletingCommentId(null);
    }
  }

  function composer(parentId: string | null = null): ReactNode {
    const replying = Boolean(parentId);
    const parent = parentId ? commentById.get(parentId) : null;
    if (!data?.user || !interactions.canInteract) return null;

    return (
      <form className={replying ? 'comment-composer is-reply' : 'comment-composer'} onSubmit={submitComment}>
        <div className="comment-composer-avatar" aria-hidden="true">
          {(data.user.displayName || data.user.username || '?').trim().charAt(0).toUpperCase() || '?'}
        </div>
        <div className="comment-composer-body">
          {replying ? (
            <div className="comment-reply-context">
              <span>Respondendo a <strong>{parent?.authorName || 'comentário'}</strong></span>
              <button type="button" onClick={() => { setReplyTo(null); setCommentBody(''); }}>Cancelar</button>
            </div>
          ) : null}
          <textarea
            required
            minLength={1}
            maxLength={2000}
            rows={replying ? 3 : 4}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder={replying ? 'Escreva uma resposta…' : 'Adicione um comentário…'}
            aria-label={replying ? 'Escrever resposta' : 'Escrever comentário'}
          />
          <div className="comment-composer-footer">
            <span>{commentBody.length}/2000</span>
            <button className="button primary" type="submit" disabled={commenting || !commentBody.trim()}>
              {commenting ? 'Publicando…' : replying ? 'Responder' : 'Comentar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  function renderComment(comment: ContentComment, depth = 0): ReactNode {
    const children = childrenByParent.get(comment.id) || [];
    const editing = editingId === comment.id;
    const replying = replyTo === comment.id;
    const depthClass = `depth-${Math.min(depth, 3)}`;

    return (
      <div className={`comment-thread-node ${depthClass}`} key={comment.id}>
        <article className="social-comment">
          <div className="social-comment-avatar" aria-hidden="true">{initialOf(comment)}</div>
          <div className="social-comment-main">
            <header className="social-comment-header">
              <Link to={`/perfil/${encodeURIComponent(comment.authorUsername)}`}>{comment.authorName}</Link>
              <span>@{comment.authorUsername}</span>
              {comment.createdAt ? <time dateTime={comment.createdAt}>{commentTime(comment.createdAt)}</time> : null}
            </header>

            {editing ? (
              <div className="comment-editor">
                <textarea
                  minLength={1}
                  maxLength={2000}
                  rows={3}
                  value={editingBody}
                  onChange={(event) => setEditingBody(event.target.value)}
                  aria-label="Editar comentário"
                />
                <div className="comment-editor-actions">
                  <button className="button primary" type="button" disabled={savingComment || !editingBody.trim()} onClick={() => void saveComment(comment.id)}>
                    {savingComment ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button className="button secondary" type="button" disabled={savingComment} onClick={() => { setEditingId(null); setEditingBody(''); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : <p>{comment.body}</p>}

            <footer className="social-comment-actions">
              {data?.user && interactions.canInteract ? (
                <button type="button" onClick={() => { setReplyTo(comment.id); setCommentBody(''); }}>Responder</button>
              ) : null}
              {comment.canEdit && !editing ? (
                <button type="button" onClick={() => { setEditingId(comment.id); setEditingBody(comment.body); }}>Editar</button>
              ) : null}
              {comment.canEdit ? (
                <button className="danger" type="button" disabled={deletingCommentId === comment.id} onClick={() => void removeComment(comment.id)}>
                  {deletingCommentId === comment.id ? 'Excluindo…' : 'Excluir'}
                </button>
              ) : null}
            </footer>

            {replying ? composer(comment.id) : null}
          </div>
        </article>

        {children.length ? (
          <div className="comment-children" aria-label={`Respostas a ${comment.authorName}`}>
            {children.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section id="comentarios" className="post-interactions comment-section" aria-labelledby="post-comments-title">
      <header className="comment-section-header">
        <div>
          <h2 id="post-comments-title">Comentários</h2>
          <p>{interactions.commentCount === 0 ? 'Seja a primeira pessoa a entrar na conversa.' : `${interactions.commentCount} ${interactions.commentCount === 1 ? 'comentário' : 'comentários'}`}</p>
        </div>
      </header>

      {!data?.user ? (
        <div className="comment-login-callout">
          <p>Entre para comentar, responder e participar da conversa.</p>
          <Link className="button secondary" to={`/entrar?retorno=${encodeURIComponent(returnPath)}`}>Entrar</Link>
        </div>
      ) : replyTo ? null : composer()}

      <div className="comment-thread-list">
        {rootComments.length ? rootComments.map((comment) => renderComment(comment)) : (
          <div className="comment-empty-state">
            <div aria-hidden="true">💬</div>
            <strong>Nenhum comentário ainda</strong>
            <p>Comece uma conversa sobre esta publicação.</p>
          </div>
        )}
      </div>
    </section>
  );
}

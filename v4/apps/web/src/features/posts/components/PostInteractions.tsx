import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ContentInteractions } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  contentId: string;
  initial: ContentInteractions;
};

export function PostInteractions({ contentId, initial }: Props) {
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [interactions, setInteractions] = useState(initial);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [liking, setLiking] = useState(false);
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
  const returnPath = `/publicacoes/${encodeURIComponent(contentId)}`;

  async function toggleLike() {
    if (!data?.user || liking) return;
    setLiking(true);
    try {
      const result = interactions.viewerLiked
        ? await services.interactions.unlike(contentId)
        : await services.interactions.like(contentId);
      setInteractions((current) => ({
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

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data?.user || commenting) return;
    setCommenting(true);
    try {
      const result = await services.interactions.comment(contentId, {
        body: commentBody.trim(),
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
        comments: current.comments.map((comment) =>
          comment.id === commentId ? result.comment : comment,
        ),
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

  return (
    <section className="post-interactions" aria-labelledby="post-interactions-title">
      <div className="post-interaction-summary">
        <h2 id="post-interactions-title">Interações</h2>
        <span>{interactions.likeCount} curtidas</span>
        <span>{interactions.commentCount} comentários</span>
      </div>

      {data?.user ? (
        <button
          type="button"
          className={interactions.viewerLiked ? 'button primary' : 'button secondary'}
          disabled={liking || !interactions.canInteract}
          onClick={() => void toggleLike()}
        >
          {liking ? 'Atualizando…' : interactions.viewerLiked ? 'Curtido' : 'Curtir'}
        </button>
      ) : (
        <Link className="button secondary" to={`/entrar?retorno=${encodeURIComponent(returnPath)}`}>
          Entre para curtir ou comentar
        </Link>
      )}

      {data?.user && interactions.canInteract ? (
        <form className="auth-form post-comment-form" onSubmit={submitComment}>
          <h3>{replyTo ? 'Responder comentário' : 'Novo comentário'}</h3>
          {replyTo ? (
            <p className="create-launcher-note">
              Respondendo a {commentById.get(replyTo)?.authorName || 'um comentário'}.{' '}
              <button className="inline-action" type="button" onClick={() => setReplyTo(null)}>
                Cancelar resposta
              </button>
            </p>
          ) : null}
          <label>
            Texto
            <textarea
              required
              minLength={1}
              maxLength={2000}
              rows={4}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
            />
          </label>
          <button className="button primary" type="submit" disabled={commenting}>
            {commenting ? 'Publicando…' : replyTo ? 'Publicar resposta' : 'Comentar'}
          </button>
        </form>
      ) : null}

      <div className="post-comment-list">
        <h3>Comentários</h3>
        {interactions.comments.length ? (
          interactions.comments.map((comment) => {
            const parent = comment.parentId ? commentById.get(comment.parentId) : null;
            const editing = editingId === comment.id;
            return (
              <article
                key={comment.id}
                className={comment.parentId ? 'post-comment post-comment-reply' : 'post-comment'}
              >
                <header>
                  <Link to={`/perfil/${encodeURIComponent(comment.authorUsername)}`}>
                    {comment.authorName}
                  </Link>
                  {parent ? <span> respondeu {parent.authorName}</span> : null}
                </header>

                {editing ? (
                  <div className="post-comment-editor">
                    <textarea
                      minLength={1}
                      maxLength={2000}
                      rows={3}
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                    />
                    <div className="post-comment-actions">
                      <button
                        className="button primary"
                        type="button"
                        disabled={savingComment}
                        onClick={() => void saveComment(comment.id)}
                      >
                        {savingComment ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        disabled={savingComment}
                        onClick={() => {
                          setEditingId(null);
                          setEditingBody('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{comment.body}</p>
                )}

                <footer className="post-comment-actions">
                  {data?.user && interactions.canInteract ? (
                    <button
                      className="inline-action"
                      type="button"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      Responder
                    </button>
                  ) : null}
                  {comment.canEdit && !editing ? (
                    <button
                      className="inline-action"
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditingBody(comment.body);
                      }}
                    >
                      Editar
                    </button>
                  ) : null}
                  {comment.canEdit ? (
                    <button
                      className="inline-action danger"
                      type="button"
                      disabled={deletingCommentId === comment.id}
                      onClick={() => void removeComment(comment.id)}
                    >
                      {deletingCommentId === comment.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  ) : null}
                </footer>
              </article>
            );
          })
        ) : (
          <p>Ainda não há comentários nesta publicação.</p>
        )}
      </div>
    </section>
  );
}

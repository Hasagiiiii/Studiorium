import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PostDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { PostInteractions } from '../components/PostInteractions.js';

type State =
  | { status: 'loading'; value: PostDetail | null; error: null }
  | { status: 'ready'; value: PostDetail; error: null }
  | { status: 'error'; value: PostDetail | null; error: string };

export function PostDetailPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading', value: null, error: null });

  const load = useCallback(async () => {
    if (!id) return;
    setState((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const value = await services.interactions.postDetail(id);
      setState({ status: 'ready', value, error: null });
    } catch (cause) {
      setState((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar a publicação.',
      }));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading' && !state.value) {
    return (
      <FeaturePage
        eyebrow="Publicação"
        title="Carregando publicação…"
        description="Buscando conteúdo e interações."
      />
    );
  }

  if (state.status === 'error' && !state.value) {
    return (
      <FeaturePage
        eyebrow="Publicação"
        title="Publicação indisponível"
        description={state.error || 'Este conteúdo não está disponível para você.'}
      >
        <button className="button secondary" type="button" onClick={() => void load()}>
          Tentar novamente
        </button>
      </FeaturePage>
    );
  }

  const detail = state.value;
  if (!detail) return null;
  const { post } = detail;

  return (
    <FeaturePage
      eyebrow="Publicação"
      title={post.title || `Publicação de ${post.authorName}`}
      description="Conteúdo social do Lorion."
    >
      <article className="post-detail">
        <header className="post-detail-meta">
          <Link to={`/perfil/${encodeURIComponent(post.authorUsername)}`}>{post.authorName}</Link>
          {post.community ? (
            <>
              <span> em </span>
              <Link to={`/comunidades/${encodeURIComponent(post.community.slug)}`}>
                {post.community.name}
              </Link>
            </>
          ) : null}
        </header>
        {post.title ? <h2>{post.title}</h2> : null}
        <p className="post-detail-body">{post.body}</p>
      </article>

      {state.status === 'error' ? (
        <p className="inline-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <PostInteractions contentId={post.id} initial={detail.interactions} />
    </FeaturePage>
  );
}

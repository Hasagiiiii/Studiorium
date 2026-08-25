import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PostDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { PostInteractions } from '../components/PostInteractions.js';
import { PostMediaGallery } from '../components/PostMediaGallery.js';

type State =
  | { status: 'loading'; value: PostDetail | null; error: null }
  | { status: 'ready'; value: PostDetail; error: null }
  | { status: 'error'; value: PostDetail | null; error: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function PostDetailPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading', value: null, error: null });

  const load = useCallback(async () => {
    if (!id) return;
    setState({ status: 'loading', value: null, error: null });
    try {
      const value = await services.interactions.postDetail(id);
      setState({ status: 'ready', value, error: null });
    } catch (cause) {
      setState({
        status: 'error',
        value: null,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar a publicação.',
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return <FeaturePage eyebrow="Publicação" title="Carregando publicação…" description="Buscando conteúdo e conversa." />;
  }

  if (state.status === 'error') {
    return (
      <FeaturePage eyebrow="Publicação" title="Publicação indisponível" description={state.error || 'Este conteúdo não está disponível para você.'}>
        <button className="button secondary" type="button" onClick={() => void load()}>Tentar novamente</button>
      </FeaturePage>
    );
  }

  const detail = state.value;
  const { post } = detail;

  return (
    <main id="main-content" className="social-post-detail-page">
      <Link className="social-post-detail-back" to="/">← Voltar para o feed</Link>

      <article className="social-post-detail-card">
        <header className="social-post-detail-header">
          <span className="social-avatar" aria-hidden="true">{initials(post.authorName)}</span>
          <div className="social-author-block">
            <Link className="social-author-name" to={`/perfil/${encodeURIComponent(post.authorUsername)}`}>{post.authorName}</Link>
            <span>@{post.authorUsername}</span>
            {post.community ? (
              <Link className="social-community-link" to={`/comunidades/${encodeURIComponent(post.community.slug)}`}>{post.community.name}</Link>
            ) : null}
          </div>
        </header>

        {post.title ? <h1 className="social-post-detail-title">{post.title}</h1> : null}
        {post.body ? <p className="social-post-detail-copy">{post.body}</p> : null}
        <PostMediaGallery media={post.media} />
      </article>

      <PostInteractions contentId={post.id} initial={detail.interactions} />
    </main>
  );
}

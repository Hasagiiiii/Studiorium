import type { SocialPost } from '@lorion/contracts';
import { Link } from 'react-router-dom';
import { PostActionBar } from './PostActionBar.js';
import { PostMediaGallery } from './PostMediaGallery.js';

type Props = {
  post: SocialPost;
  compact?: boolean;
  showAuthor?: boolean;
};

function authorInitial(post: SocialPost): string {
  return post.authorName.trim().charAt(0).toUpperCase() || '?';
}

export function SocialPostCard({ post, compact = false, showAuthor = true }: Props) {
  const postPath = `/publicacoes/${encodeURIComponent(post.id)}`;

  return (
    <article className={compact ? 'social-post-card is-compact' : 'social-post-card'}>
      {showAuthor ? (
        <header className="social-post-header">
          <Link className="social-avatar" to={`/perfil/${encodeURIComponent(post.authorUsername)}`} aria-label={`Perfil de ${post.authorName}`}>
            {authorInitial(post)}
          </Link>
          <div className="social-author-block">
            <Link className="social-author-name" to={`/perfil/${encodeURIComponent(post.authorUsername)}`}>
              {post.authorName}
            </Link>
            <span>@{post.authorUsername}</span>
            {post.community ? (
              <Link className="social-community-link" to={`/comunidades/${encodeURIComponent(post.community.slug)}`}>
                em {post.community.name}
              </Link>
            ) : null}
          </div>
        </header>
      ) : post.community ? (
        <div className="social-post-context">
          <Link to={`/comunidades/${encodeURIComponent(post.community.slug)}`}>{post.community.name}</Link>
        </div>
      ) : null}

      <div className="social-post-content">
        {post.title ? <h2><Link to={postPath}>{post.title}</Link></h2> : null}
        {post.body ? <p className="social-feed-copy">{post.body}</p> : null}
        <PostMediaGallery media={post.media} />
      </div>

      <PostActionBar contentId={post.id} initial={post.interactions} compact={compact} />
    </article>
  );
}

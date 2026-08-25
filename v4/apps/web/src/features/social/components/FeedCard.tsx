import type { FeedEntry } from '@lorion/contracts';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

function destination(entry: FeedEntry): string {
  if (entry.type === 'post') return `/publicacoes/${encodeURIComponent(entry.item.id)}`;
  if (entry.type === 'publication') return `/pesquisas/${encodeURIComponent(entry.item.slug)}`;
  if (entry.type === 'discussion') return `/discussoes/${encodeURIComponent(entry.item.id)}`;
  if (entry.type === 'news') return `/noticias/${encodeURIComponent(entry.item.slug)}`;
  return `/projetos/${encodeURIComponent(entry.item.id)}`;
}

function label(entry: FeedEntry): string {
  if (entry.type === 'post') return 'Publicação';
  if (entry.type === 'publication') return 'Pesquisa';
  if (entry.type === 'discussion') return 'Discussão';
  if (entry.type === 'news') return 'Notícia';
  return 'Projeto';
}

function summary(entry: FeedEntry): string {
  if (entry.type === 'post') return entry.item.body;
  if (entry.type === 'publication') return entry.item.abstract;
  if (entry.type === 'discussion') return entry.item.body;
  if (entry.type === 'news') return entry.item.summary;
  return entry.item.notes || 'Projeto compartilhado com a comunidade.';
}

export function FeedCard({ entry, index = 0 }: { entry: FeedEntry; index?: number }) {
  const text = summary(entry);
  const reduceMotion = useReducedMotion();
  const link = destination(entry);

  return (
    <motion.article
      className={`feed-card feed-${entry.type}`}
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.24,
        delay: reduceMotion ? 0 : Math.min(index, 6) * 0.035,
      }}
    >
      {entry.type === 'post' ? (
        <header className="social-post-header">
          <div className="social-avatar" aria-hidden="true">
            {entry.item.authorName.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <div className="social-author-block">
            <Link className="social-author-name" to={`/perfil/${encodeURIComponent(entry.item.authorUsername)}`}>
              {entry.item.authorName}
            </Link>
            <span>@{entry.item.authorUsername}</span>
            {entry.item.community ? (
              <Link className="social-community-link" to={`/comunidades/${encodeURIComponent(entry.item.community.slug)}`}>
                em {entry.item.community.name}
              </Link>
            ) : null}
          </div>
        </header>
      ) : (
        <span className="social-content-badge">{label(entry)}</span>
      )}

      {entry.item.title ? (
        <h2>
          <Link to={link}>{entry.item.title}</Link>
        </h2>
      ) : null}
      {text ? <p className="social-feed-copy">{text.slice(0, 340)}</p> : null}

      <footer className="social-card-actions">
        <Link to={link}>{entry.type === 'post' ? 'Conversar' : 'Abrir'}</Link>
        {entry.type === 'news' && entry.item.likeCount > 0 ? <span>{entry.item.likeCount} curtidas</span> : null}
      </footer>
    </motion.article>
  );
}

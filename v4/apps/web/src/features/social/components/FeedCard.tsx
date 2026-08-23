import type { FeedEntry } from '@lorion/contracts';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

function destination(entry: Exclude<FeedEntry, { type: 'post' }>): string {
  if (entry.type === 'publication') return `/pesquisas/${encodeURIComponent(entry.item.slug)}`;
  if (entry.type === 'discussion') return `/discussoes/${encodeURIComponent(entry.item.id)}`;
  if (entry.type === 'news') return `/noticias/${encodeURIComponent(entry.item.slug)}`;
  return `/projetos/${encodeURIComponent(entry.item.id)}`;
}

function label(entry: FeedEntry): string {
  if (entry.type === 'publication') return 'Pesquisa';
  if (entry.type === 'discussion') return 'Discussão';
  if (entry.type === 'news') return 'Notícia';
  if (entry.type === 'post') return 'Publicação';
  return 'Projeto';
}

function summary(entry: FeedEntry): string {
  if (entry.type === 'publication') return entry.item.abstract;
  if (entry.type === 'discussion') return entry.item.body;
  if (entry.type === 'news') return entry.item.summary;
  if (entry.type === 'post') return entry.item.body || '';
  return entry.item.notes || 'Projeto compartilhado com a comunidade.';
}

export function FeedCard({ entry, index = 0 }: { entry: FeedEntry; index?: number }) {
  const text = summary(entry);
  const reduceMotion = useReducedMotion();

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
      <span className="eyebrow">{label(entry)}</span>
      {entry.type === 'post' ? (
        <>
          <div className="post-author-line">
            <strong>{entry.item.authorDisplayName}</strong>
            <Link to={`/perfil/${encodeURIComponent(entry.item.authorUsername)}`}>
              @{entry.item.authorUsername}
            </Link>
          </div>
          {text ? <p className="post-body">{text}</p> : null}
          {entry.item.media?.kind === 'image' ? (
            <img
              className="post-media"
              src={entry.item.media.url}
              alt={text ? `Imagem publicada por ${entry.item.authorDisplayName}` : `Imagem de ${entry.item.authorDisplayName}`}
              loading="lazy"
              decoding="async"
              width={entry.item.media.width || undefined}
              height={entry.item.media.height || undefined}
            />
          ) : null}
          {entry.item.media?.kind === 'video' ? (
            <video
              className="post-media"
              src={entry.item.media.url}
              controls
              playsInline
              preload="metadata"
              aria-label={`Vídeo publicado por ${entry.item.authorDisplayName}`}
            />
          ) : null}
          {entry.item.likeCount > 0 ? <footer>{entry.item.likeCount} curtidas</footer> : null}
        </>
      ) : (
        <>
          <h2>
            <Link to={destination(entry)}>{entry.item.title}</Link>
          </h2>
          {text ? <p>{text.slice(0, 340)}</p> : null}
          {entry.type === 'news' && entry.item.likeCount > 0 ? (
            <footer>{entry.item.likeCount} curtidas</footer>
          ) : null}
        </>
      )}
    </motion.article>
  );
}

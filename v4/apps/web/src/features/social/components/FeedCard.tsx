import type { FeedEntry } from '@lorion/contracts';
import { Link } from 'react-router-dom';

function destination(entry: FeedEntry): string {
  if (entry.type === 'publication') return `/pesquisas/${encodeURIComponent(entry.item.slug)}`;
  if (entry.type === 'discussion') return `/discussoes/${encodeURIComponent(entry.item.id)}`;
  if (entry.type === 'tech') return `/oficina/${encodeURIComponent(entry.item.slug)}`;
  if (entry.type === 'news') return `/noticias/${encodeURIComponent(entry.item.slug)}`;
  return `/projetos/${encodeURIComponent(entry.item.id)}`;
}

function label(entry: FeedEntry): string {
  if (entry.type === 'publication') return 'Pesquisa';
  if (entry.type === 'discussion') return 'Discussão';
  if (entry.type === 'tech') return 'Oficina';
  if (entry.type === 'news') return 'Notícia';
  return 'Projeto';
}

function title(entry: FeedEntry): string {
  return entry.item.title;
}

function summary(entry: FeedEntry): string {
  if (entry.type === 'publication') return entry.item.abstract;
  if (entry.type === 'discussion') return entry.item.body;
  if (entry.type === 'tech') return entry.item.summary;
  if (entry.type === 'news') return entry.item.summary;
  return entry.item.notes || 'Projeto compartilhado com a comunidade.';
}

export function FeedCard({ entry }: { entry: FeedEntry }) {
  return (
    <article className={`feed-card feed-${entry.type}`}>
      <span className="eyebrow">{label(entry)}</span>
      <h2><Link to={destination(entry)}>{title(entry)}</Link></h2>
      <p>{summary(entry).slice(0, 340)}</p>
    </article>
  );
}

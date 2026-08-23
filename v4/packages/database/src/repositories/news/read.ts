import { newsArticleSchema, type NewsArticle } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

function mapNews(row: Record<string, unknown>): NewsArticle {
  return newsArticleSchema.parse({
    id: row.id,
    contributorId: row.contributor_id,
    authorName: row.author_name,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    category: row.category,
    status: row.status,
    featured: row.featured,
    hypes: Number(row.hypes || 0),
    certifiedBy: row.certified_by,
    certifiedAt: row.certified_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listPublishedNews(): Promise<NewsArticle[]> {
  const result = await database()
    .from('news_articles')
    .select('*')
    .eq('status', 'published')
    .not('certified_at', 'is', null)
    .is('deleted_at', null)
    .order('featured', { ascending: false })
    .order('hypes', { ascending: false })
    .order('published_at', { ascending: false });

  return queryList(result).map((row) => mapNews(row as Record<string, unknown>));
}

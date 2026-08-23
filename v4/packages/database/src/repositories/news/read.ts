import {
  newsArticleSchema,
  newsContributorSchema,
  type NewsArticle,
  type NewsContributor,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export function mapNews(row: Record<string, unknown>): NewsArticle {
  return newsArticleSchema.parse({
    id: row.id,
    contributorId: row.contributor_id,
    authorName: row.author_name,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    category: row.category,
    sources: Array.isArray(row.sources) ? row.sources : [],
    status: row.status,
    aiReviewStatus: row.ai_review_status,
    aiReview: row.ai_review && typeof row.ai_review === 'object' ? row.ai_review : {},
    editorialNote: row.editorial_note,
    featured: row.featured,
    likeCount: Number(row.hypes || 0),
    certifiedBy: row.certified_by,
    certifiedAt: row.certified_at,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapNewsContributor(row: Record<string, unknown>): NewsContributor {
  return newsContributorSchema.parse({
    userId: row.user_id,
    status: row.status,
    area: row.area,
    institution: row.institution,
    portfolioUrl: row.portfolio_url,
    statement: row.statement,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapArticles(rows: unknown[]): NewsArticle[] {
  return rows.map((row) => mapNews(row as Record<string, unknown>));
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

  return mapArticles(queryList(result));
}

export async function findNewsContributor(userId: string): Promise<NewsContributor | null> {
  const result = await database()
    .from('news_contributors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNewsContributor(result.data as Record<string, unknown>) : null;
}

export async function listNewsContributorApplications(status = 'pending'): Promise<NewsContributor[]> {
  const result = await database()
    .from('news_contributors')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true });
  return queryList(result).map((row) => mapNewsContributor(row as Record<string, unknown>));
}

export async function listOwnedNews(userId: string, deleted = false): Promise<NewsArticle[]> {
  let query = database()
    .from('news_articles')
    .select('*')
    .eq('contributor_id', userId)
    .order('updated_at', { ascending: false });
  query = deleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  return mapArticles(queryList(await query));
}

export async function findOwnedNews(articleId: string, userId: string): Promise<NewsArticle | null> {
  const result = await database()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .eq('contributor_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNews(result.data as Record<string, unknown>) : null;
}

export async function listEditorialNewsQueue(): Promise<NewsArticle[]> {
  const result = await database()
    .from('news_articles')
    .select('*')
    .eq('status', 'editorial_review')
    .is('deleted_at', null)
    .order('updated_at', { ascending: true });
  return mapArticles(queryList(result));
}

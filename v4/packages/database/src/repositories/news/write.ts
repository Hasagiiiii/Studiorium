import type {
  ApplyNewsContributorInput,
  NewsContributorDecisionInput,
  NewsDraftInput,
  NewsEditorialDecisionInput,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { mapNews, mapNewsContributor } from './read.js';

function slugBase(title: string): string {
  const value = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return value || 'noticia';
}

async function uniqueNewsSlug(title: string, ignoredId?: string): Promise<string> {
  const base = slugBase(title);
  for (let index = 1; index < 1000; index += 1) {
    const slug = index === 1 ? base : `${base}-${index}`;
    let query = database().from('news_articles').select('id').eq('slug', slug);
    if (ignoredId) query = query.neq('id', ignoredId);
    const result = await query.maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function upsertNewsContributorApplication(userId: string, input: ApplyNewsContributorInput) {
  const now = new Date().toISOString();
  const result = await database()
    .from('news_contributors')
    .upsert(
      {
        user_id: userId,
        status: 'pending',
        area: input.area,
        institution: input.institution,
        portfolio_url: input.portfolioUrl,
        statement: input.statement,
        reviewer_id: null,
        review_note: '',
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return mapNewsContributor(result.data as Record<string, unknown>);
}

export async function decideNewsContributor(
  userId: string,
  reviewerId: string,
  input: NewsContributorDecisionInput,
) {
  const result = await database()
    .from('news_contributors')
    .update({
      status: input.status,
      reviewer_id: reviewerId,
      review_note: input.note,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNewsContributor(result.data as Record<string, unknown>) : null;
}

export async function createNewsDraft(input: {
  id: string;
  contributorId: string;
  authorName: string;
  draft: NewsDraftInput;
}) {
  const now = new Date().toISOString();
  const result = await database()
    .from('news_articles')
    .insert({
      id: input.id,
      contributor_id: input.contributorId,
      author_name: input.authorName,
      title: input.draft.title,
      slug: await uniqueNewsSlug(input.draft.title),
      summary: input.draft.summary,
      body: input.draft.body,
      category: input.draft.category,
      sources: input.draft.sources,
      status: 'draft',
      ai_review_status: 'pending',
      ai_review: {},
      editorial_note: '',
      featured: false,
      certified_by: null,
      certified_at: null,
      published_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return mapNews(result.data as Record<string, unknown>);
}

export async function updateNewsDraft(articleId: string, contributorId: string, draft: NewsDraftInput) {
  const current = await database()
    .from('news_articles')
    .select('id,title,status')
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .is('deleted_at', null)
    .maybeSingle();
  if (current.error) throw new Error(current.error.message);
  if (!current.data || ['ai_review', 'editorial_review'].includes(current.data.status)) return null;

  const patch: Record<string, unknown> = {
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    category: draft.category,
    sources: draft.sources,
    status: 'draft',
    ai_review_status: 'pending',
    ai_review: {},
    editorial_note: '',
    featured: false,
    certified_by: null,
    certified_at: null,
    published_at: null,
    updated_at: new Date().toISOString(),
  };
  if (current.data.title !== draft.title) patch.slug = await uniqueNewsSlug(draft.title, articleId);

  const result = await database()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNews(result.data as Record<string, unknown>) : null;
}

export async function submitNewsForEditorial(
  articleId: string,
  contributorId: string,
  aiReviewStatus: 'approved' | 'flagged',
  aiReview: Record<string, unknown>,
) {
  const result = await database()
    .from('news_articles')
    .update({
      status: 'editorial_review',
      ai_review_status: aiReviewStatus,
      ai_review: aiReview,
      editorial_note: '',
      featured: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .in('status', ['draft', 'changes_requested'])
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNews(result.data as Record<string, unknown>) : null;
}

export async function softDeleteNews(articleId: string, contributorId: string): Promise<boolean> {
  const result = await database()
    .from('news_articles')
    .update({
      deleted_at: new Date().toISOString(),
      featured: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .not('status', 'in', '(ai_review,editorial_review)')
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function restoreNews(articleId: string, contributorId: string): Promise<boolean> {
  const result = await database()
    .from('news_articles')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function purgeNews(articleId: string, contributorId: string): Promise<boolean> {
  const result = await database()
    .from('news_articles')
    .delete()
    .eq('id', articleId)
    .eq('contributor_id', contributorId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function decideNewsEditorial(
  articleId: string,
  reviewerId: string,
  input: NewsEditorialDecisionInput,
) {
  const now = new Date().toISOString();
  const result = await database()
    .from('news_articles')
    .update({
      status: input.status,
      editorial_note: input.note,
      featured: input.status === 'published' ? input.featured : false,
      certified_by: input.status === 'published' ? reviewerId : null,
      certified_at: input.status === 'published' ? now : null,
      published_at: input.status === 'published' ? now : null,
      updated_at: now,
    })
    .eq('id', articleId)
    .eq('status', 'editorial_review')
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapNews(result.data as Record<string, unknown>) : null;
}

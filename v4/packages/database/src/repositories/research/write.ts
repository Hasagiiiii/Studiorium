import type { ResearchDraftInput } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { mapPublication } from './read.js';

function slugBase(title: string): string {
  const value = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return value || 'pesquisa';
}

async function uniquePublicationSlug(title: string, ignoredId?: string): Promise<string> {
  const base = slugBase(title);
  for (let index = 1; index < 1000; index += 1) {
    const slug = index === 1 ? base : `${base}-${index}`;
    let query = database().from('publications').select('id').eq('slug', slug);
    if (ignoredId) query = query.neq('id', ignoredId);
    const result = await query.maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createResearchDraft(input: {
  id: string;
  ownerId: string;
  authorName: string;
  draft: ResearchDraftInput;
}) {
  const now = new Date().toISOString();
  const result = await database()
    .from('publications')
    .insert({
      id: input.id,
      owner_id: input.ownerId,
      author_name: input.authorName,
      title: input.draft.title,
      slug: await uniquePublicationSlug(input.draft.title),
      abstract: input.draft.abstract,
      content: input.draft.content,
      area: input.draft.area,
      level: input.draft.level,
      keywords: input.draft.keywords,
      license: input.draft.license,
      status: 'draft',
      moderation_note: '',
      featured: false,
      published_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return mapPublication(result.data as Record<string, unknown>);
}

export async function updateResearchDraft(
  id: string,
  ownerId: string,
  draft: ResearchDraftInput,
) {
  const current = await database()
    .from('publications')
    .select('id,title,status')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .maybeSingle();
  if (current.error) throw new Error(current.error.message);
  if (!current.data) return null;
  if (current.data.status === 'pending_review') return null;
  const result = await database()
    .from('publications')
    .update({
      title: draft.title,
      slug:
        current.data.title === draft.title
          ? undefined
          : await uniquePublicationSlug(draft.title, id),
      abstract: draft.abstract,
      content: draft.content,
      area: draft.area,
      level: draft.level,
      keywords: draft.keywords,
      license: draft.license,
      status: 'draft',
      moderation_note: '',
      featured: false,
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapPublication(result.data as Record<string, unknown>) : null;
}

export async function submitResearchForReview(id: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('publications')
    .update({ status: 'pending_review', moderation_note: '', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .in('status', ['draft', 'rejected'])
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function softDeleteResearch(id: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('publications')
    .update({ deleted_at: new Date().toISOString(), featured: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .neq('status', 'pending_review')
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function restoreResearch(id: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('publications')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function purgeResearch(id: string, ownerId: string): Promise<boolean> {
  const result = await database()
    .from('publications')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function reviewResearch(
  id: string,
  input: { status: 'published' | 'rejected' | 'pending_review'; note: string; featured: boolean },
) {
  const patch: Record<string, unknown> = {
    status: input.status,
    moderation_note: input.note,
    featured: input.status === 'published' ? input.featured : false,
    published_at: input.status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const result = await database()
    .from('publications')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? mapPublication(result.data as Record<string, unknown>) : null;
}

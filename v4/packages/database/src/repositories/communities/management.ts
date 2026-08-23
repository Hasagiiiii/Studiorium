import {
  communityManagedMemberSchema,
  communitySchema,
  type Community,
  type CommunityManagedMember,
  type CommunityMediaKind,
  type CreateCommunityInput,
  type UpdateCommunityInput,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';
import { listCommunities } from './read.js';

function slugBase(name: string): string {
  const value = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return value || 'comunidade';
}

async function uniqueCommunitySlug(name: string): Promise<string> {
  const base = slugBase(name);
  for (let index = 1; index < 1000; index += 1) {
    const slug = index === 1 ? base : `${base}-${index}`;
    const result = await database().from('communities').select('id').eq('slug', slug).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createManagedCommunity(
  id: string,
  creatorId: string,
  input: CreateCommunityInput,
): Promise<Community> {
  const slug = await uniqueCommunitySlug(input.name);
  const result = await database().rpc('create_community_v4', {
    p_id: id,
    p_slug: slug,
    p_name: input.name,
    p_area: input.area,
    p_description: input.description,
    p_visibility: input.visibility,
    p_rules: input.rules,
    p_creator_id: creatorId,
  });
  if (result.error) throw new Error(result.error.message);
  const communities = await listCommunities(creatorId);
  const community = communities.find((item) => item.id === id);
  if (!community) throw new Error('Comunidade criada, mas não encontrada após persistência.');
  return community;
}

export async function findManagedCommunity(slug: string, viewerId: string): Promise<Community | null> {
  const communities = await listCommunities(viewerId);
  return communities.find((community) => community.slug === slug) || null;
}

export async function updateCommunityRecord(
  communityId: string,
  input: UpdateCommunityInput,
): Promise<boolean> {
  const result = await database()
    .from('communities')
    .update({
      name: input.name,
      area: input.area,
      description: input.description,
      visibility: input.visibility,
      rules: input.rules,
      updated_at: new Date().toISOString(),
    })
    .eq('id', communityId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function listManagedCommunityMembers(
  communityId: string,
): Promise<CommunityManagedMember[]> {
  const memberships = queryList(
    await database()
      .from('community_members')
      .select('user_id,role,status,moderation_status,joined_at')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true }),
  ) as Array<{
    user_id: string;
    role: 'member' | 'moderator' | 'curator' | 'leader';
    status: 'active' | 'left' | 'pending' | 'rejected';
    moderation_status: 'clear' | 'muted' | 'removed';
    joined_at: string | null;
  }>;
  if (!memberships.length) return [];
  const profiles = queryList(
    await database()
      .from('profiles')
      .select('user_id,username,display_name')
      .in(
        'user_id',
        memberships.map((membership) => membership.user_id),
      ),
  ) as Array<{ user_id: string; username: string; display_name: string }>;
  const profileByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
  return memberships.map((membership) => {
    const profile = profileByUser.get(membership.user_id);
    return communityManagedMemberSchema.parse({
      userId: membership.user_id,
      username: profile?.username || '',
      displayName: profile?.display_name || profile?.username || 'Membro',
      role: membership.role,
      status: membership.status,
      moderationStatus: membership.moderation_status,
      joinedAt: membership.joined_at,
    });
  });
}

export async function updateCommunityMemberRecord(
  communityId: string,
  userId: string,
  input: { role?: 'member' | 'moderator' | 'curator'; moderationStatus?: 'clear' | 'muted' | 'removed' },
): Promise<boolean> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.role) patch.role = input.role;
  if (input.moderationStatus) patch.moderation_status = input.moderationStatus;
  const result = await database()
    .from('community_members')
    .update(patch)
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('role', 'leader')
    .select('user_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function transferCommunityLeadership(
  communityId: string,
  currentLeaderId: string,
  newLeaderId: string,
): Promise<boolean> {
  const result = await database().rpc('transfer_community_leadership', {
    p_community_id: communityId,
    p_current_leader: currentLeaderId,
    p_new_leader: newLeaderId,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}

function mediaColumn(kind: CommunityMediaKind): 'avatar_path' | 'cover_path' {
  return kind === 'avatar' ? 'avatar_path' : 'cover_path';
}

export async function findCommunityMediaById(
  communityId: string,
  kind: CommunityMediaKind,
): Promise<string | null> {
  const column = mediaColumn(kind);
  const result = await database().from('communities').select(column).eq('id', communityId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? String((result.data as Record<string, unknown>)[column] || '') || null : null;
}

export async function setCommunityMediaPath(
  communityId: string,
  kind: CommunityMediaKind,
  path: string | null,
): Promise<boolean> {
  const column = mediaColumn(kind);
  const result = await database()
    .from('communities')
    .update({ [column]: path, updated_at: new Date().toISOString() })
    .eq('id', communityId)
    .select('id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function uploadCommunityMediaObject(path: string, bytes: Buffer, mime: string): Promise<void> {
  const result = await database().storage.from('community-media').upload(path, bytes, {
    contentType: mime,
    cacheControl: '3600',
    upsert: true,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function removeCommunityMediaObject(path: string): Promise<void> {
  const result = await database().storage.from('community-media').remove([path]);
  if (result.error) throw new Error(result.error.message);
}

export async function signedCommunityMediaUrl(path: string): Promise<string> {
  const result = await database().storage.from('community-media').createSignedUrl(path, 90);
  if (result.error || !result.data?.signedUrl) throw new Error(result.error?.message || 'Imagem indisponível.');
  return result.data.signedUrl;
}

export async function communityMediaRecord(slug: string) {
  const result = await database()
    .from('communities')
    .select('id,slug,visibility,status,deleted_at,avatar_path,cover_path')
    .eq('slug', slug)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  const row = result.data as Record<string, unknown>;
  return {
    id: String(row.id),
    slug: String(row.slug),
    visibility: String(row.visibility),
    status: String(row.status),
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    avatarPath: row.avatar_path ? String(row.avatar_path) : null,
    coverPath: row.cover_path ? String(row.cover_path) : null,
  };
}

export function withCommunityMediaFlags(community: Community, row: { avatarPath?: string | null; coverPath?: string | null }): Community {
  return communitySchema.parse({
    ...community,
    hasAvatar: Boolean(row.avatarPath),
    hasCover: Boolean(row.coverPath),
  });
}

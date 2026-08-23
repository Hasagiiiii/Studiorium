import type { PostMedia, SocialPost } from '@lorion/contracts';
import { database } from '../../core/client.js';

const BUCKET = 'lorion-media';

type MediaRow = {
  id: string;
  user_id: string;
  bucket: string;
  path: string;
  public_url: string;
  kind: 'image' | 'video';
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  status: 'pending' | 'ready';
};

type PostRow = {
  id: string;
  user_id: string;
  kind: SocialPost['kind'];
  body: string | null;
  media_id: string | null;
  like_count: number | null;
  created_at: string;
};

function mediaFromRow(row: MediaRow | undefined): PostMedia | null {
  if (!row || row.status !== 'ready') return null;
  return {
    id: row.id,
    kind: row.kind,
    url: row.public_url,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
  };
}

async function hydratePosts(rows: PostRow[]): Promise<SocialPost[]> {
  if (!rows.length) return [];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const mediaIds = [...new Set(rows.map((row) => row.media_id).filter((id): id is string => Boolean(id)))];

  const [profilesResult, mediaResult] = await Promise.all([
    database().from('profiles').select('user_id,username,display_name').in('user_id', userIds),
    mediaIds.length
      ? database().from('social_media').select('*').in('id', mediaIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (mediaResult.error) throw new Error(mediaResult.error.message);

  const profiles = new Map(
    (profilesResult.data || []).map((row) => [
      String(row.user_id),
      { username: String(row.username || ''), displayName: String(row.display_name || row.username || 'Membro') },
    ]),
  );
  const media = new Map((mediaResult.data || []).map((row) => [String(row.id), row as MediaRow]));

  return rows.map((row) => {
    const profile = profiles.get(row.user_id) || { username: 'membro', displayName: 'Membro' };
    return {
      id: row.id,
      ownerId: row.user_id,
      authorUsername: profile.username,
      authorDisplayName: profile.displayName,
      kind: row.kind,
      body: row.body,
      media: row.media_id ? mediaFromRow(media.get(row.media_id)) : null,
      createdAt: row.created_at,
      likeCount: Number(row.like_count || 0),
    };
  });
}

export async function reserveSocialMedia(input: Omit<MediaRow, 'status' | 'width' | 'height'>) {
  const result = await database()
    .from('social_media')
    .insert({ ...input, width: null, height: null, status: 'pending' })
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data as MediaRow;
}

export async function findOwnedSocialMedia(id: string, userId: string): Promise<MediaRow | null> {
  const result = await database()
    .from('social_media')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return (result.data as MediaRow | null) || null;
}

export async function finalizeSocialMedia(
  id: string,
  userId: string,
  values: Pick<MediaRow, 'width' | 'height' | 'duration_seconds' | 'size_bytes' | 'mime_type'>,
): Promise<MediaRow> {
  const result = await database()
    .from('social_media')
    .update({ ...values, status: 'ready' })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data as MediaRow;
}

export async function deleteOwnedSocialMedia(id: string, userId: string): Promise<MediaRow | null> {
  const owned = await findOwnedSocialMedia(id, userId);
  if (!owned) return null;
  const result = await database().from('social_media').delete().eq('id', id).eq('user_id', userId);
  if (result.error) throw new Error(result.error.message);
  return owned;
}

export async function createSocialPost(input: {
  id: string;
  userId: string;
  kind: SocialPost['kind'];
  body: string | null;
  mediaId: string | null;
}): Promise<SocialPost> {
  const result = await database()
    .from('social_posts')
    .insert({
      id: input.id,
      user_id: input.userId,
      kind: input.kind,
      body: input.body,
      media_id: input.mediaId,
    })
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return (await hydratePosts([result.data as PostRow]))[0] as SocialPost;
}

export async function listPublicSocialPosts(limit = 120): Promise<SocialPost[]> {
  const result = await database()
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (result.error) throw new Error(result.error.message);
  return hydratePosts((result.data || []) as PostRow[]);
}

export async function listSocialPostsByUser(userId: string, limit = 80): Promise<SocialPost[]> {
  const result = await database()
    .from('social_posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (result.error) throw new Error(result.error.message);
  return hydratePosts((result.data || []) as PostRow[]);
}

export async function findOwnedSocialPost(id: string, userId: string): Promise<PostRow | null> {
  const result = await database()
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return (result.data as PostRow | null) || null;
}

export async function deleteOwnedSocialPost(id: string, userId: string): Promise<PostRow | null> {
  const owned = await findOwnedSocialPost(id, userId);
  if (!owned) return null;
  const result = await database().from('social_posts').delete().eq('id', id).eq('user_id', userId);
  if (result.error) throw new Error(result.error.message);
  return owned;
}

export function socialMediaBucket() {
  return BUCKET;
}

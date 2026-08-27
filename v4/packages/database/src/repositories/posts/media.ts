import { postMediaSchema, type PostMedia } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

const BUCKET = 'social-media';

function publicUrl(path: string): string {
  return database().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function pendingMediaIds(ownerId: string, mediaIds: string[]): Promise<string[]> {
  if (!mediaIds.length) return [];
  const rows = queryList(
    await database()
      .from('post_media')
      .select('id')
      .eq('owner_id', ownerId)
      .is('content_id', null)
      .in('id', mediaIds),
  ) as Array<{ id: string }>;
  return rows.map((row) => row.id);
}

export async function assertPendingPostMedia(ownerId: string, mediaIds: string[]): Promise<void> {
  if (!mediaIds.length) return;
  const available = await pendingMediaIds(ownerId, mediaIds);
  if (available.length !== mediaIds.length || new Set(mediaIds).size !== mediaIds.length) {
    throw new Error('Uma ou mais mídias não estão disponíveis para esta publicação.');
  }
}

export async function createPendingPostMedia(input: {
  id: string;
  ownerId: string;
  mediaType: 'image' | 'video';
  path: string;
  mimeType: string;
  bytes: Uint8Array;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}): Promise<PostMedia> {
  const upload = await database().storage.from(BUCKET).upload(input.path, input.bytes, {
    contentType: input.mimeType,
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  const insert = await database()
    .from('post_media')
    .insert({
      id: input.id,
      owner_id: input.ownerId,
      media_type: input.mediaType,
      storage_path: input.path,
      mime_type: input.mimeType,
      size_bytes: input.bytes.byteLength,
      duration_seconds: input.durationSeconds,
      width: input.width,
      height: input.height,
    })
    .select('*')
    .single();

  if (insert.error) {
    await database().storage.from(BUCKET).remove([input.path]);
    throw new Error(insert.error.message);
  }

  const row = insert.data as Record<string, unknown>;
  return postMediaSchema.parse({
    id: row.id,
    type: row.media_type,
    url: publicUrl(String(row.storage_path)),
    previewUrl: null,
    caption: row.caption,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
    position: row.position,
  });
}

export async function bindPendingPostMedia(input: {
  ownerId: string;
  contentId: string;
  mediaIds: string[];
}): Promise<void> {
  if (!input.mediaIds.length) return;
  await assertPendingPostMedia(input.ownerId, input.mediaIds);

  for (const [position, id] of input.mediaIds.entries()) {
    const result = await database()
      .from('post_media')
      .update({ content_id: input.contentId, position })
      .eq('id', id)
      .eq('owner_id', input.ownerId)
      .is('content_id', null);
    if (result.error) throw new Error(result.error.message);
  }
}

export async function listPostMedia(contentIds: string[]): Promise<Map<string, PostMedia[]>> {
  if (!contentIds.length) return new Map();
  const rows = queryList(
    await database()
      .from('post_media')
      .select(
        'id,content_id,media_type,storage_path,caption,width,height,duration_seconds,position',
      )
      .in('content_id', contentIds)
      .order('position', { ascending: true }),
  ) as Array<Record<string, unknown>>;

  const byContent = new Map<string, PostMedia[]>();
  for (const row of rows) {
    const contentId = String(row.content_id || '');
    if (!contentId) continue;
    const media = postMediaSchema.parse({
      id: row.id,
      type: row.media_type,
      url: publicUrl(String(row.storage_path)),
      previewUrl: null,
      caption: row.caption,
      width: row.width,
      height: row.height,
      durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
      position: row.position,
    });
    byContent.set(contentId, [...(byContent.get(contentId) || []), media]);
  }
  return byContent;
}

import {
  createSocialPost,
  database,
  deleteOwnedSocialMedia,
  deleteOwnedSocialPost,
  finalizeSocialMedia,
  findOwnedSocialMedia,
  findPublicProfile,
  listPublicSocialPosts,
  listSocialPostsByUser,
  reserveSocialMedia,
  socialMediaBucket,
} from '@lorion/database';
import {
  createPostInputSchema,
  feedResponseSchema,
  mediaFinalizeInputSchema,
  mediaReservationInputSchema,
  mediaReservationSchema,
  socialPostSchema,
  socialPostsResponseSchema,
  type FeedResponse,
  type MediaReservation,
  type SocialPost,
  type SocialPostsResponse,
} from '@lorion/contracts';
import type { ApiRequest } from '../../core/http/types.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, notFound } from '../../core/http/errors.js';
import { entityId } from '../../core/security/token.js';
import { requireSessionUser } from '../../auth/session.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function extensionFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/avif') return 'avif';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  throw badRequest('Formato de mídia não permitido.', 'UNSUPPORTED_MEDIA_TYPE');
}

function validateMedia(
  kind: 'image' | 'video',
  mimeType: string,
  sizeBytes: number,
  duration?: number | null,
) {
  const allowed = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
  if (!allowed.has(mimeType))
    throw badRequest('Formato de mídia não permitido.', 'UNSUPPORTED_MEDIA_TYPE');
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (sizeBytes > maxBytes) {
    throw badRequest(
      kind === 'image' ? 'A imagem deve ter no máximo 12 MB.' : 'O vídeo deve ter no máximo 80 MB.',
      'MEDIA_TOO_LARGE',
    );
  }
  if (
    kind === 'video' &&
    (duration == null || !Number.isFinite(duration) || duration <= 0 || duration > 60)
  ) {
    throw badRequest('O vídeo deve ter duração máxima de 60 segundos.', 'VIDEO_DURATION_INVALID');
  }
}

function storageMetadata(entry: unknown): { size: number | null; mimeType: string | null } {
  if (!entry || typeof entry !== 'object') return { size: null, mimeType: null };
  const record = entry as Record<string, unknown>;
  const metadata =
    record.metadata && typeof record.metadata === 'object'
      ? (record.metadata as Record<string, unknown>)
      : {};
  const sizeValue = metadata.size ?? record.size;
  const mimeValue = metadata.mimetype ?? metadata.mimeType ?? record.mimetype;
  const size = Number(sizeValue);
  return {
    size: Number.isFinite(size) && size > 0 ? size : null,
    mimeType: typeof mimeValue === 'string' ? mimeValue : null,
  };
}

export async function reserveMedia(request: ApiRequest): Promise<MediaReservation> {
  const user = await requireSessionUser(request);
  const input = mediaReservationInputSchema.parse(await readJson(request));
  validateMedia(input.kind, input.mimeType, input.sizeBytes, input.durationSeconds);

  const id = entityId('med');
  const path = `${user.id}/${id}.${extensionFor(input.mimeType)}`;
  const bucket = socialMediaBucket();
  const storage = database().storage.from(bucket);
  const signed = await storage.createSignedUploadUrl(path, { upsert: false });
  if (signed.error || !signed.data)
    throw new Error(signed.error?.message || 'Falha ao preparar upload.');
  const publicUrl = storage.getPublicUrl(path).data.publicUrl;

  await reserveSocialMedia({
    id,
    user_id: user.id,
    bucket,
    path,
    public_url: publicUrl,
    kind: input.kind,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    duration_seconds: input.kind === 'video' ? Number(input.durationSeconds) : null,
  });

  return mediaReservationSchema.parse({
    mediaId: id,
    path,
    signedUrl: signed.data.signedUrl,
    token: signed.data.token,
    publicUrl,
  });
}

export async function finalizeMedia(request: ApiRequest): Promise<SocialPost['media']> {
  const user = await requireSessionUser(request);
  const input = mediaFinalizeInputSchema.parse(await readJson(request));
  const media = await findOwnedSocialMedia(input.mediaId, user.id);
  if (!media) throw notFound('Mídia não encontrada.');
  if (media.status === 'ready')
    return socialPostSchema.shape.media.parse({
      id: media.id,
      kind: media.kind,
      url: media.public_url,
      mimeType: media.mime_type,
      sizeBytes: Number(media.size_bytes),
      width: media.width,
      height: media.height,
      durationSeconds: media.duration_seconds,
    });

  const slash = media.path.lastIndexOf('/');
  const folder = slash >= 0 ? media.path.slice(0, slash) : '';
  const filename = slash >= 0 ? media.path.slice(slash + 1) : media.path;
  const listed = await database()
    .storage.from(media.bucket)
    .list(folder, { search: filename, limit: 10 });
  if (listed.error) throw new Error(listed.error.message);
  const object = listed.data?.find((entry) => entry.name === filename);
  if (!object) throw badRequest('O arquivo ainda não foi enviado.', 'MEDIA_NOT_UPLOADED');
  const actual = storageMetadata(object);
  const actualSize = actual.size ?? Number(media.size_bytes);
  const actualMime = actual.mimeType || media.mime_type;
  validateMedia(
    media.kind,
    actualMime,
    actualSize,
    input.durationSeconds ?? media.duration_seconds,
  );
  if (actualMime !== media.mime_type) {
    throw badRequest(
      'O tipo real do arquivo não corresponde ao upload autorizado.',
      'MEDIA_MIME_MISMATCH',
    );
  }

  const finalized = await finalizeSocialMedia(media.id, user.id, {
    width: media.kind === 'image' ? (input.width ?? null) : null,
    height: media.kind === 'image' ? (input.height ?? null) : null,
    duration_seconds:
      media.kind === 'video' ? Number(input.durationSeconds ?? media.duration_seconds) : null,
    size_bytes: actualSize,
    mime_type: actualMime,
  });

  return socialPostSchema.shape.media.parse({
    id: finalized.id,
    kind: finalized.kind,
    url: finalized.public_url,
    mimeType: finalized.mime_type,
    sizeBytes: Number(finalized.size_bytes),
    width: finalized.width,
    height: finalized.height,
    durationSeconds: finalized.duration_seconds,
  });
}

export async function discardMedia(request: ApiRequest, id: string) {
  const user = await requireSessionUser(request);
  const media = await findOwnedSocialMedia(id, user.id);
  if (!media) return { ok: true };
  const removed = await database().storage.from(media.bucket).remove([media.path]);
  if (removed.error && !/not found/i.test(removed.error.message))
    throw new Error(removed.error.message);
  await deleteOwnedSocialMedia(id, user.id);
  return { ok: true };
}

export async function publishPost(request: ApiRequest): Promise<SocialPost> {
  const user = await requireSessionUser(request);
  const input = createPostInputSchema.parse(await readJson(request));
  const body = input.body?.trim() || null;
  const media = input.mediaId ? await findOwnedSocialMedia(input.mediaId, user.id) : null;

  if (input.kind === 'text') {
    if (!body) throw badRequest('Escreva algo antes de publicar.');
    if (media) throw badRequest('Publicação de texto não deve conter arquivo.');
  } else {
    if (!media || media.status !== 'ready')
      throw badRequest('Finalize o upload da mídia antes de publicar.');
    if ((input.kind === 'photo' || input.kind === 'photo_text') && media.kind !== 'image') {
      throw badRequest('Escolha uma imagem para este tipo de publicação.');
    }
    if (input.kind === 'video' && media.kind !== 'video')
      throw badRequest('Escolha um vídeo válido.');
    if (input.kind === 'photo_text' && !body) throw badRequest('Adicione um texto à foto.');
    if (input.kind === 'photo' && body)
      throw badRequest('Use “foto + texto” para publicar uma legenda.');
  }

  return socialPostSchema.parse(
    await createSocialPost({
      id: entityId('pst'),
      userId: user.id,
      kind: input.kind,
      body,
      mediaId: media?.id || null,
    }),
  );
}

export async function removePost(request: ApiRequest, id: string) {
  const user = await requireSessionUser(request);
  const post = await deleteOwnedSocialPost(id, user.id);
  if (!post) throw notFound('Publicação não encontrada.');
  if (post.media_id) {
    const media = await findOwnedSocialMedia(post.media_id, user.id);
    if (media) {
      const removed = await database().storage.from(media.bucket).remove([media.path]);
      if (removed.error && !/not found/i.test(removed.error.message))
        throw new Error(removed.error.message);
      await deleteOwnedSocialMedia(media.id, user.id);
    }
  }
  return { ok: true };
}

export async function publicPostsFeed(): Promise<FeedResponse> {
  const posts = await listPublicSocialPosts();
  return feedResponseSchema.parse({
    feed: posts.map((item) => ({ type: 'post', at: item.createdAt, item })),
  });
}

export async function profilePosts(username: string): Promise<SocialPostsResponse> {
  const profile = await findPublicProfile(username);
  if (!profile) throw notFound('Perfil não encontrado.');
  return socialPostsResponseSchema.parse({ posts: await listSocialPostsByUser(profile.userId) });
}

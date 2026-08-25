import {
  bindPendingPostMedia,
  createPendingPostMedia,
  createSocialPost,
  findCommunityMembershipTarget,
  findSocialPostById,
} from '@lorion/database';
import {
  createPostInputSchema,
  MAX_POST_VIDEO_DURATION_SECONDS,
  type PostMedia,
  type SocialPost,
} from '@lorion/contracts';
import { requireSessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, forbidden, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const ALLOWED_MEDIA = new Map<string, { type: 'image' | 'video'; ext: string }>([
  ['image/jpeg', { type: 'image', ext: 'jpg' }],
  ['image/png', { type: 'image', ext: 'png' }],
  ['image/webp', { type: 'image', ext: 'webp' }],
  ['image/gif', { type: 'image', ext: 'gif' }],
  ['video/mp4', { type: 'video', ext: 'mp4' }],
  ['video/webm', { type: 'video', ext: 'webm' }],
  ['video/quicktime', { type: 'video', ext: 'mov' }],
]);

function numberHeader(request: ApiRequest, name: string): number | null {
  const raw = request.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function readBinary(request: ApiRequest): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_MEDIA_BYTES) throw badRequest('O arquivo pode ter no máximo 25 MB.');
    chunks.push(buffer);
  }
  if (!size) throw badRequest('Selecione um arquivo para enviar.');
  return new Uint8Array(Buffer.concat(chunks));
}

export async function uploadPostMedia(request: ApiRequest): Promise<PostMedia> {
  const user = await requireSessionUser(request);
  const mimeType = String(request.headers['content-type'] || '').split(';')[0]?.trim().toLowerCase();
  const mediaInfo = mimeType ? ALLOWED_MEDIA.get(mimeType) : null;
  if (!mediaInfo) {
    throw badRequest('Formato não suportado. Use JPG, PNG, WEBP, GIF, MP4, WEBM ou MOV.');
  }

  const width = numberHeader(request, 'x-media-width');
  const height = numberHeader(request, 'x-media-height');
  const durationSeconds = numberHeader(request, 'x-media-duration');
  if (mediaInfo.type === 'video') {
    if (durationSeconds === null) throw badRequest('Não foi possível validar a duração do vídeo.');
    if (durationSeconds > MAX_POST_VIDEO_DURATION_SECONDS) {
      throw badRequest(`O vídeo pode ter no máximo ${MAX_POST_VIDEO_DURATION_SECONDS} segundos.`);
    }
  }

  const bytes = await readBinary(request);
  const id = entityId('med');
  const path = `${user.id}/${id}.${mediaInfo.ext}`;
  return createPendingPostMedia({
    id,
    ownerId: user.id,
    mediaType: mediaInfo.type,
    path,
    mimeType,
    bytes,
    durationSeconds: mediaInfo.type === 'video' ? durationSeconds : null,
    width,
    height,
  });
}

export async function createPost(request: ApiRequest): Promise<SocialPost> {
  const user = await requireSessionUser(request);
  const parsed = createPostInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise o texto, o título, a mídia e a comunidade da publicação.');

  let communityId: string | null = null;
  if (parsed.data.communitySlug) {
    const community = await findCommunityMembershipTarget(parsed.data.communitySlug.toLowerCase());
    if (!community || community.status !== 'active' || community.deleted_at) {
      throw notFound('Comunidade não encontrada.');
    }
    communityId = community.id;
  }

  const contentId = entityId('pst');
  const created = await createSocialPost({
    contentId,
    authorId: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    communityId,
  });
  if (!created) {
    throw forbidden(
      'Você não pode publicar nesta comunidade ou sua conta não está apta a publicar.',
    );
  }

  await bindPendingPostMedia({
    ownerId: user.id,
    contentId,
    mediaIds: parsed.data.mediaIds,
  });

  const post = await findSocialPostById(contentId, user.id);
  if (!post) throw new Error('Publicação criada, mas não encontrada após persistência.');
  return post;
}

import {
  createSocialPost,
  findCommunityMembershipTarget,
  findSocialPostById,
} from '@lorion/database';
import { createPostInputSchema, type SocialPost } from '@lorion/contracts';
import { requireSessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, forbidden, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

export async function createPost(request: ApiRequest): Promise<SocialPost> {
  const user = await requireSessionUser(request);
  const parsed = createPostInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise o texto, o título e a comunidade da publicação.');

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

  const post = await findSocialPostById(contentId, user.id);
  if (!post) throw new Error('Publicação criada, mas não encontrada após persistência.');
  return post;
}

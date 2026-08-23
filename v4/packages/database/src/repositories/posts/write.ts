import { database } from '../../core/client.js';

export async function createSocialPost(input: {
  contentId: string;
  authorId: string;
  title: string;
  body: string;
  communityId: string | null;
}): Promise<boolean> {
  const result = await database().rpc('create_social_post', {
    p_content_id: input.contentId,
    p_author_id: input.authorId,
    p_title: input.title,
    p_body: input.body,
    p_community_id: input.communityId,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}

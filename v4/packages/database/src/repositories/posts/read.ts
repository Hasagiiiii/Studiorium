import { socialPostSchema, type SocialPost } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';
import { listPostMedia } from './media.js';

type ContentItemRow = {
  id: string;
  author_id: string;
  community_id: string | null;
  visibility: 'public' | 'community';
  moderation_status: string;
  created_at: string | null;
  updated_at: string | null;
};

type PostRow = { content_id: string; title: string; body: string };
type ProfileRow = { user_id: string; username: string; display_name: string };
type CommunityRow = { id: string; slug: string; name: string };
type LikeRow = { content_id: string; user_id: string };
type CommentRow = { content_id: string };

async function hydratePosts(
  items: ContentItemRow[],
  viewerId?: string | null,
): Promise<SocialPost[]> {
  if (!items.length) return [];

  const contentIds = items.map((item) => item.id);
  const authorIds = [...new Set(items.map((item) => item.author_id))];
  const communityIds = [
    ...new Set(items.map((item) => item.community_id).filter((id): id is string => Boolean(id))),
  ];

  const [
    postsResult,
    profilesResult,
    communitiesResult,
    mediaByContent,
    likesResult,
    commentsResult,
  ] = await Promise.all([
    database().from('posts').select('content_id,title,body').in('content_id', contentIds),
    database().from('profiles').select('user_id,username,display_name').in('user_id', authorIds),
    communityIds.length
      ? database().from('communities').select('id,slug,name').in('id', communityIds)
      : Promise.resolve({ data: [], error: null }),
    listPostMedia(contentIds),
    database().from('content_likes').select('content_id,user_id').in('content_id', contentIds),
    database()
      .from('content_comments')
      .select('content_id')
      .in('content_id', contentIds)
      .eq('moderation_status', 'clear')
      .is('deleted_at', null),
  ]);

  const posts = queryList(postsResult) as PostRow[];
  const profiles = queryList(profilesResult) as ProfileRow[];
  const communities = queryList(communitiesResult) as CommunityRow[];
  const likes = queryList(likesResult) as LikeRow[];
  const comments = queryList(commentsResult) as CommentRow[];
  const postById = new Map(posts.map((post) => [post.content_id, post]));
  const profileByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const communityById = new Map(communities.map((community) => [community.id, community]));

  const likeCount = new Map<string, number>();
  const commentCount = new Map<string, number>();
  const viewerLikes = new Set<string>();
  likes.forEach((like) => {
    likeCount.set(like.content_id, (likeCount.get(like.content_id) || 0) + 1);
    if (viewerId && like.user_id === viewerId) viewerLikes.add(like.content_id);
  });
  comments.forEach((comment) => {
    commentCount.set(comment.content_id, (commentCount.get(comment.content_id) || 0) + 1);
  });

  return items.flatMap((item) => {
    const post = postById.get(item.id);
    const profile = profileByUser.get(item.author_id);
    if (!post || !profile) return [];
    const community = item.community_id ? communityById.get(item.community_id) : null;
    if (item.visibility === 'community' && !community) return [];

    return [
      socialPostSchema.parse({
        id: item.id,
        authorId: item.author_id,
        authorUsername: profile.username,
        authorName: profile.display_name || profile.username,
        title: post.title,
        body: post.body,
        media: mediaByContent.get(item.id) || [],
        interactions: {
          likeCount: likeCount.get(item.id) || 0,
          commentCount: commentCount.get(item.id) || 0,
          viewerLiked: viewerLikes.has(item.id),
          canInteract: Boolean(viewerId),
        },
        community: community
          ? { id: community.id, slug: community.slug, name: community.name }
          : null,
        visibility: item.visibility,
        moderationStatus: item.moderation_status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }),
    ];
  });
}

async function contentItemsByAuthor(authorId: string): Promise<ContentItemRow[]> {
  return queryList(
    await database()
      .from('content_items')
      .select('id,author_id,community_id,visibility,moderation_status,created_at,updated_at')
      .eq('type', 'post')
      .eq('author_id', authorId)
      .eq('moderation_status', 'clear')
      .order('created_at', { ascending: false }),
  ) as ContentItemRow[];
}

export async function listPublicSocialPosts(
  limit = 200,
  viewerId?: string | null,
): Promise<SocialPost[]> {
  const items = queryList(
    await database()
      .from('content_items')
      .select('id,author_id,community_id,visibility,moderation_status,created_at,updated_at')
      .eq('type', 'post')
      .eq('visibility', 'public')
      .eq('moderation_status', 'clear')
      .order('created_at', { ascending: false })
      .limit(limit),
  ) as ContentItemRow[];
  return hydratePosts(items, viewerId);
}

export async function listCommunitySocialPosts(
  communityId: string,
  viewerId?: string | null,
): Promise<SocialPost[]> {
  const items = queryList(
    await database()
      .from('content_items')
      .select('id,author_id,community_id,visibility,moderation_status,created_at,updated_at')
      .eq('type', 'post')
      .eq('community_id', communityId)
      .eq('moderation_status', 'clear')
      .order('created_at', { ascending: false }),
  ) as ContentItemRow[];
  return hydratePosts(items, viewerId);
}

export async function listProfileSocialPosts(
  authorId: string,
  viewerId?: string | null,
): Promise<SocialPost[]> {
  const items = await contentItemsByAuthor(authorId);
  if (!items.length) return [];
  if (viewerId === authorId) return hydratePosts(items, viewerId);

  let allowedCommunityIds = new Set<string>();
  if (viewerId) {
    const memberships = queryList(
      await database()
        .from('community_members')
        .select('community_id')
        .eq('user_id', viewerId)
        .eq('status', 'active')
        .eq('moderation_status', 'clear'),
    ) as Array<{ community_id: string }>;
    allowedCommunityIds = new Set(memberships.map((membership) => membership.community_id));
  }

  return hydratePosts(
    items.filter(
      (item) =>
        item.visibility === 'public' ||
        Boolean(item.community_id && allowedCommunityIds.has(item.community_id)),
    ),
    viewerId,
  );
}

export async function findSocialPostById(
  contentId: string,
  viewerId?: string | null,
): Promise<SocialPost | null> {
  const result = await database()
    .from('content_items')
    .select('id,author_id,community_id,visibility,moderation_status,created_at,updated_at')
    .eq('id', contentId)
    .eq('type', 'post')
    .eq('moderation_status', 'clear')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;

  const item = result.data as ContentItemRow;
  if (item.visibility === 'community' && viewerId !== item.author_id) {
    if (!viewerId || !item.community_id) return null;
    const membership = await database()
      .from('community_members')
      .select('community_id')
      .eq('community_id', item.community_id)
      .eq('user_id', viewerId)
      .eq('status', 'active')
      .eq('moderation_status', 'clear')
      .maybeSingle();
    if (membership.error) throw new Error(membership.error.message);
    if (!membership.data) return null;
  }

  return (await hydratePosts([item], viewerId))[0] || null;
}

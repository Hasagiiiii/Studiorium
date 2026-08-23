import {
  contentCommentSchema,
  contentInteractionsSchema,
  type ContentComment,
  type ContentInteractions,
} from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export type AccessibleContentItem = {
  id: string;
  type: string;
  authorId: string;
  communityId: string | null;
  visibility: 'public' | 'community';
};

type ContentItemRow = {
  id: string;
  type: string;
  author_id: string;
  community_id: string | null;
  visibility: 'public' | 'community';
  moderation_status: string;
};

type CommentRow = {
  id: string;
  content_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  moderation_status: string;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
};

export async function findAccessibleContentItem(
  contentId: string,
  viewerId?: string | null,
): Promise<AccessibleContentItem | null> {
  const result = await database()
    .from('content_items')
    .select('id,type,author_id,community_id,visibility,moderation_status')
    .eq('id', contentId)
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

  return {
    id: item.id,
    type: item.type,
    authorId: item.author_id,
    communityId: item.community_id,
    visibility: item.visibility,
  };
}

export async function contentInteractionCounts(
  contentId: string,
  viewerId?: string | null,
): Promise<{ likeCount: number; commentCount: number; viewerLiked: boolean }> {
  const [likesResult, commentsResult] = await Promise.all([
    database().from('content_likes').select('user_id').eq('content_id', contentId),
    database()
      .from('content_comments')
      .select('id')
      .eq('content_id', contentId)
      .eq('moderation_status', 'clear')
      .is('deleted_at', null),
  ]);

  const likes = queryList(likesResult) as Array<{ user_id: string }>;
  const comments = queryList(commentsResult);
  return {
    likeCount: likes.length,
    commentCount: comments.length,
    viewerLiked: Boolean(viewerId && likes.some((row) => row.user_id === viewerId)),
  };
}

export async function listContentComments(
  contentId: string,
  viewerId?: string | null,
): Promise<ContentComment[]> {
  const rows = queryList(
    await database()
      .from('content_comments')
      .select('id,content_id,author_id,parent_id,body,moderation_status,created_at,updated_at')
      .eq('content_id', contentId)
      .eq('moderation_status', 'clear')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(300),
  ) as CommentRow[];
  if (!rows.length) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const profiles = queryList(
    await database()
      .from('profiles')
      .select('user_id,username,display_name')
      .in('user_id', authorIds),
  ) as ProfileRow[];
  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));

  return rows.flatMap((row) => {
    const profile = profileByUserId.get(row.author_id);
    if (!profile) return [];
    return [
      contentCommentSchema.parse({
        id: row.id,
        contentId: row.content_id,
        authorId: row.author_id,
        authorUsername: profile.username,
        authorName: profile.display_name || profile.username,
        parentId: row.parent_id,
        body: row.body,
        moderationStatus: row.moderation_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        canEdit: viewerId === row.author_id,
      }),
    ];
  });
}

export async function findContentCommentById(
  commentId: string,
  viewerId?: string | null,
): Promise<ContentComment | null> {
  const result = await database()
    .from('content_comments')
    .select('content_id')
    .eq('id', commentId)
    .eq('moderation_status', 'clear')
    .is('deleted_at', null)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  const comments = await listContentComments(String(result.data.content_id), viewerId);
  return comments.find((comment) => comment.id === commentId) || null;
}

export async function loadContentInteractions(
  contentId: string,
  viewerId?: string | null,
): Promise<ContentInteractions | null> {
  const access = await findAccessibleContentItem(contentId, viewerId);
  if (!access) return null;
  const [counts, comments] = await Promise.all([
    contentInteractionCounts(contentId, viewerId),
    listContentComments(contentId, viewerId),
  ]);
  return contentInteractionsSchema.parse({
    ...counts,
    canInteract: Boolean(viewerId),
    comments,
  });
}

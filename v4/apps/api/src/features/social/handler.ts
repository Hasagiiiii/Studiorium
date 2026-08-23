import {
  createNotification,
  findPublicProfile,
  followCounts,
  followUser,
  isFollowing,
  listFollowingIds,
  listPublicProjects,
  listPublicSocialPosts,
  listPublishedDiscussions,
  listPublishedNews,
  listPublishedResearch,
  unfollowUser,
} from '@lorion/database';
import {
  feedResponseSchema,
  followMutationSchema,
  followSummarySchema,
  socialGraphSchema,
  type FeedResponse,
  type FollowMutation,
  type FollowSummary,
  type SocialGraph,
} from '@lorion/contracts';
import { buildFeedFromSources, sortFeed } from '@lorion/domain';
import type { ApiRequest } from '../../core/http/types.js';
import { forbidden, notFound } from '../../core/http/errors.js';
import { entityId } from '../../core/security/token.js';
import { publicSessionUser, requireSessionUser, sessionUser } from '../../auth/session.js';

function contentOwnerId(entry: FeedResponse['feed'][number]): string | null {
  if (entry.type === 'publication') return entry.item.ownerId;
  if (entry.type === 'discussion') return entry.item.authorId;
  if (entry.type === 'news') return entry.item.contributorId;
  return entry.item.ownerId;
}

export async function myGraph(request: ApiRequest): Promise<SocialGraph> {
  const user = await requireSessionUser(request);
  return socialGraphSchema.parse({ followingIds: await listFollowingIds(user.id) });
}

export async function profileSocial(request: ApiRequest, username: string): Promise<FollowSummary> {
  const profile = await findPublicProfile(username);
  if (!profile) throw notFound('Perfil não encontrado.');
  const viewer = await sessionUser(request);
  const counts = await followCounts(profile.userId);
  const following = viewer ? await isFollowing(viewer.id, profile.userId) : false;

  return followSummarySchema.parse({
    ...counts,
    isFollowing: following,
    canFollow: Boolean(viewer && viewer.id !== profile.userId),
  });
}

export async function setFollow(
  request: ApiRequest,
  username: string,
  following: boolean,
): Promise<FollowMutation> {
  const viewer = await requireSessionUser(request);
  const profile = await findPublicProfile(username);
  if (!profile) throw notFound('Perfil não encontrado.');
  if (profile.userId === viewer.id) throw forbidden('Você não pode seguir a própria conta.');

  if (following) {
    const alreadyFollowing = await isFollowing(viewer.id, profile.userId);
    await followUser(viewer.id, profile.userId);
    if (!alreadyFollowing) {
      const actor = await publicSessionUser(request);
      await createNotification({
        id: entityId('ntf'),
        userId: profile.userId,
        type: 'follow',
        title: 'Novo seguidor',
        message: `${actor?.displayName || 'Alguém'} começou a seguir você.`,
        link: actor?.username ? `/perfil/${encodeURIComponent(actor.username)}` : '/',
      });
    }
  } else {
    await unfollowUser(viewer.id, profile.userId);
  }

  const [targetCounts, viewerCounts] = await Promise.all([
    followCounts(profile.userId),
    followCounts(viewer.id),
  ]);
  return followMutationSchema.parse({
    following,
    followerCount: targetCounts.followerCount,
    followingCount: viewerCounts.followingCount,
  });
}

export async function followingFeed(request: ApiRequest): Promise<FeedResponse> {
  const viewer = await requireSessionUser(request);
  const followingIds = new Set(await listFollowingIds(viewer.id));
  if (!followingIds.size) return feedResponseSchema.parse({ feed: [] });

  const [publications, discussions, news, projects, posts] = await Promise.all([
    listPublishedResearch(),
    listPublishedDiscussions(),
    listPublishedNews(),
    listPublicProjects(),
    listPublicSocialPosts(),
  ]);
  const entries = [
    ...buildFeedFromSources({ publications, discussions, news, projects }),
    ...posts.map((item) => ({ type: 'post' as const, at: item.createdAt, item })),
  ].filter((entry) => {
    const ownerId = contentOwnerId(entry);
    return Boolean(ownerId && followingIds.has(ownerId));
  });

  return feedResponseSchema.parse({ feed: sortFeed(entries, 'following') });
}

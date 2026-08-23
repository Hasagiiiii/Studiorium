import { bootstrapSchema, type BootstrapPayload } from '@lorion/contracts';
import {
  excludedUserIdsForViewer,
  findProfileByUserId,
  listBookReviews,
  listBooks,
  listCommunities,
  listPublicProfiles,
  listPublicProjects,
  listPublicSocialPosts,
  listPublishedDiscussions,
  listPublishedNews,
  listPublishedResearch,
  listUserProjects,
  loadSiteSettings,
  userPermissions,
} from '@lorion/database';
import type { ApiRequest } from '../../core/http/types.js';
import { publicSessionUser, sessionUser } from '../../auth/session.js';
import { isPasswordResetEmailConfigured } from '../auth/password-reset-email.js';

const STAFF_PERMISSIONS = new Set([
  'admin.full',
  'moderation.queue',
  'moderation.content',
  'content.curate',
  'content.edit',
  'users.manage',
  'roles.manage',
]);

function mergeById<T extends { id: string }>(...groups: readonly T[][]): T[] {
  const values = new Map<string, T>();
  groups.flat().forEach((item) => values.set(item.id, item));
  return [...values.values()];
}

export async function bootstrap(request: ApiRequest): Promise<BootstrapPayload> {
  const account = await sessionUser(request);
  const viewerId = account?.id ?? null;

  const [
    postsRaw,
    publicationsRaw,
    newsRaw,
    books,
    bookReviewsRaw,
    publicProjectsRaw,
    discussionsRaw,
    publicProfilesRaw,
    communities,
    settings,
    personalProjects,
    ownProfile,
    user,
    excludedRaw,
    permissions,
  ] = await Promise.all([
    listPublicSocialPosts(),
    listPublishedResearch(),
    listPublishedNews(),
    listBooks(),
    listBookReviews(),
    listPublicProjects(),
    listPublishedDiscussions(),
    listPublicProfiles(),
    listCommunities(viewerId),
    loadSiteSettings(),
    viewerId ? listUserProjects(viewerId) : Promise.resolve([]),
    viewerId ? findProfileByUserId(viewerId) : Promise.resolve(null),
    publicSessionUser(request),
    viewerId ? excludedUserIdsForViewer(viewerId) : Promise.resolve([]),
    viewerId ? userPermissions(viewerId) : Promise.resolve([]),
  ]);

  const excluded = new Set(excludedRaw);
  const posts = postsRaw.filter((item) => !excluded.has(item.authorId));
  const publications = publicationsRaw.filter((item) => !excluded.has(item.ownerId));
  const news = newsRaw.filter((item) => !item.contributorId || !excluded.has(item.contributorId));
  const bookReviews = bookReviewsRaw.filter((item) => !excluded.has(item.userId));
  const publicProjects = publicProjectsRaw.filter((item) => !excluded.has(item.ownerId));
  const discussions = discussionsRaw.filter((item) => !excluded.has(item.authorId));
  const publicProfiles = publicProfilesRaw.filter((item) => !excluded.has(item.userId));

  const profiles =
    ownProfile && !publicProfiles.some((profile) => profile.userId === ownProfile.userId)
      ? [ownProfile, ...publicProfiles]
      : publicProfiles;

  return bootstrapSchema.parse({
    posts,
    publications,
    news,
    books,
    bookReviews,
    projects: mergeById(publicProjects, personalProjects),
    discussions,
    profiles,
    communities,
    settings,
    capabilities: {
      passwordResetAvailable: isPasswordResetEmailConfigured(),
      staffDashboard: permissions.some((permission) => STAFF_PERMISSIONS.has(permission)),
    },
    user,
  });
}

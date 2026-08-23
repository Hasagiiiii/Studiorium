import { bootstrapSchema, type BootstrapPayload } from '@lorion/contracts';
import {
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
} from '@lorion/database';
import type { ApiRequest } from '../../core/http/types.js';
import { publicSessionUser, sessionUser } from '../../auth/session.js';
import { isPasswordResetEmailConfigured } from '../auth/password-reset-email.js';

function mergeById<T extends { id: string }>(...groups: readonly T[][]): T[] {
  const values = new Map<string, T>();
  groups.flat().forEach((item) => values.set(item.id, item));
  return [...values.values()];
}

export async function bootstrap(request: ApiRequest): Promise<BootstrapPayload> {
  const account = await sessionUser(request);
  const viewerId = account?.id ?? null;

  const [
    posts,
    publications,
    news,
    books,
    bookReviews,
    publicProjects,
    discussions,
    publicProfiles,
    communities,
    settings,
    personalProjects,
    ownProfile,
    user,
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
  ]);

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
    },
    user,
  });
}

import { bootstrapSchema, type BootstrapPayload } from '@lorion/contracts';
import {
  listBookReviews,
  listBooks,
  listCommunities,
  listPublicCodeProjects,
  listPublicProfiles,
  listPublicProjects,
  listPublishedDiscussions,
  listPublishedNews,
  listPublishedResearch,
  listUserCodeProjects,
  listUserProjects,
  loadSiteSettings,
} from '@lorion/database';
import type { ApiRequest } from '../../core/http/types.js';
import { publicSessionUser, sessionUser } from '../../auth/session.js';

function mergeById<T extends { id: string }>(...groups: readonly T[][]): T[] {
  const values = new Map<string, T>();
  groups.flat().forEach((item) => values.set(item.id, item));
  return [...values.values()];
}

export async function bootstrap(request: ApiRequest): Promise<BootstrapPayload> {
  const account = await sessionUser(request);
  const viewerId = account?.id ?? null;

  const [
    publications,
    publicCodeProjects,
    news,
    books,
    bookReviews,
    publicProjects,
    discussions,
    profiles,
    communities,
    settings,
    personalProjects,
    personalCodeProjects,
    user,
  ] = await Promise.all([
    listPublishedResearch(),
    listPublicCodeProjects(),
    listPublishedNews(),
    listBooks(),
    listBookReviews(),
    listPublicProjects(),
    listPublishedDiscussions(),
    listPublicProfiles(),
    listCommunities(viewerId),
    loadSiteSettings(),
    viewerId ? listUserProjects(viewerId) : Promise.resolve([]),
    viewerId ? listUserCodeProjects(viewerId) : Promise.resolve([]),
    publicSessionUser(request),
  ]);

  return bootstrapSchema.parse({
    publications,
    codeProjects: mergeById(publicCodeProjects, personalCodeProjects),
    news,
    books,
    bookReviews,
    projects: mergeById(publicProjects, personalProjects),
    discussions,
    profiles,
    communities,
    settings,
    user,
  });
}

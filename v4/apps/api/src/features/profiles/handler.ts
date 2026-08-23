import {
  findProfileByUserId,
  findProfileByUsername,
  listProfileBookshelf,
  listProfileCommunities,
  listPublicProjectsByUserId,
  listPublishedResearchByOwnerId,
  setBookshelfVisibility,
} from '@lorion/database';
import {
  bookshelfPrivacyInputSchema,
  profileDetailSchema,
  type Profile,
  type ProfileDetail,
} from '@lorion/contracts';
import { requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, notFound } from '../../core/http/errors.js';
import type { ApiRequest } from '../../core/http/types.js';

function normalizedUsername(value: string): string {
  try {
    return decodeURIComponent(value || '')
      .trim()
      .toLowerCase();
  } catch {
    throw notFound('Perfil não encontrado.');
  }
}

export async function profileDetail(
  request: ApiRequest,
  rawUsername: string,
): Promise<ProfileDetail> {
  const username = normalizedUsername(rawUsername);
  if (!username) throw notFound('Perfil não encontrado.');

  const [viewer, profile] = await Promise.all([
    sessionUser(request),
    findProfileByUsername(username),
  ]);
  if (!profile) throw notFound('Perfil não encontrado.');

  const isOwnProfile = viewer?.id === profile.userId;
  if (!profile.isPublic && !isOwnProfile) throw notFound('Perfil não encontrado.');

  const [publications, projects, communities, bookshelf] = await Promise.all([
    listPublishedResearchByOwnerId(profile.userId),
    listPublicProjectsByUserId(profile.userId),
    listProfileCommunities(profile.userId, isOwnProfile),
    profile.bookshelfPublic || isOwnProfile
      ? listProfileBookshelf(profile.userId)
      : Promise.resolve([]),
  ]);

  return profileDetailSchema.parse({
    profile,
    publications,
    projects,
    communities,
    bookshelf,
    isOwnProfile,
  });
}

export async function updateBookshelfPrivacy(request: ApiRequest): Promise<Profile> {
  const user = await requireSessionUser(request);
  const parsed = bookshelfPrivacyInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Preferência de privacidade inválida.');

  const updated = await setBookshelfVisibility(user.id, parsed.data.bookshelfPublic);
  if (!updated) throw notFound('Perfil não encontrado.');

  const profile = await findProfileByUserId(user.id);
  if (!profile) throw notFound('Perfil não encontrado.');
  return profile;
}

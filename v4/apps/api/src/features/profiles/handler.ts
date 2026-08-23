import {
  findProfileByUserId,
  findProfileByUsername,
  findProfileMedia,
  findProfileMediaByUserId,
  hasBlockBetween,
  listProfileBookshelf,
  listProfileCommunities,
  listProfileSocialPosts,
  listPublicProjectsByUserId,
  listPublishedResearchByOwnerId,
  profileSafetyState,
  removeProfileMediaObject,
  setBookshelfVisibility,
  setProfileMediaPath,
  signedProfileMediaUrl,
  updateProfileRecord,
  uploadProfileMediaObject,
} from '@lorion/database';
import {
  bookshelfPrivacyInputSchema,
  profileDetailSchema,
  profileMediaKindSchema,
  profileMediaUploadInputSchema,
  updateProfileInputSchema,
  type Profile,
  type ProfileDetail,
} from '@lorion/contracts';
import { requireSessionUser, sessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, notFound } from '../../core/http/errors.js';
import type { ApiRequest, ApiResponse } from '../../core/http/types.js';
import { validateProfileImage } from '../../core/security/image.js';

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
  const viewerSafety =
    viewer && !isOwnProfile
      ? await profileSafetyState(viewer.id, profile.userId)
      : { blocked: false, muted: false, blockedByTarget: false };
  if (viewerSafety.blockedByTarget) throw notFound('Perfil não encontrado.');

  const [posts, publications, projects, communities, bookshelf] = viewerSafety.blocked
    ? [[], [], [], [], []]
    : await Promise.all([
        listProfileSocialPosts(profile.userId, viewer?.id),
        listPublishedResearchByOwnerId(profile.userId),
        listPublicProjectsByUserId(profile.userId),
        listProfileCommunities(profile.userId, isOwnProfile),
        profile.bookshelfPublic || isOwnProfile
          ? listProfileBookshelf(profile.userId)
          : Promise.resolve([]),
      ]);

  return profileDetailSchema.parse({
    profile,
    posts,
    publications,
    projects,
    communities,
    bookshelf,
    viewerSafety,
    isOwnProfile,
  });
}

export async function updateOwnProfile(request: ApiRequest): Promise<Profile> {
  const user = await requireSessionUser(request);
  const parsed = updateProfileInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados do perfil.');
  if (!(await updateProfileRecord(user.id, parsed.data, !user.is_minor))) {
    throw notFound('Perfil não encontrado.');
  }
  const profile = await findProfileByUserId(user.id);
  if (!profile) throw notFound('Perfil não encontrado.');
  return profile;
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

export async function uploadOwnProfileMedia(request: ApiRequest): Promise<Profile> {
  const user = await requireSessionUser(request);
  const parsed = profileMediaUploadInputSchema.safeParse(await readJson(request, 5 * 1024 * 1024));
  if (!parsed.success) throw badRequest('Imagem de perfil inválida.');
  const { kind, file } = parsed.data;
  const { ext, mime, bytes } = validateProfileImage(file);
  const previousPath = await findProfileMediaByUserId(user.id, kind);
  const storagePath = `${user.id}/${kind}${ext}`;
  await uploadProfileMediaObject(storagePath, bytes, mime);
  try {
    if (!(await setProfileMediaPath(user.id, kind, storagePath))) throw notFound('Perfil não encontrado.');
  } catch (cause) {
    await removeProfileMediaObject(storagePath).catch(() => undefined);
    throw cause;
  }
  if (previousPath && previousPath !== storagePath) {
    await removeProfileMediaObject(previousPath).catch((cause) =>
      console.warn('[Lorion v4 profile media cleanup]', cause),
    );
  }
  const profile = await findProfileByUserId(user.id);
  if (!profile) throw notFound('Perfil não encontrado.');
  return profile;
}

export async function removeOwnProfileMedia(
  request: ApiRequest,
  rawKind: string,
): Promise<Profile> {
  const user = await requireSessionUser(request);
  const parsedKind = profileMediaKindSchema.safeParse(rawKind);
  if (!parsedKind.success) throw badRequest('Tipo de imagem inválido.');
  const previousPath = await findProfileMediaByUserId(user.id, parsedKind.data);
  if (!(await setProfileMediaPath(user.id, parsedKind.data, null))) {
    throw notFound('Perfil não encontrado.');
  }
  if (previousPath) {
    await removeProfileMediaObject(previousPath).catch((cause) =>
      console.warn('[Lorion v4 profile media remove]', cause),
    );
  }
  const profile = await findProfileByUserId(user.id);
  if (!profile) throw notFound('Perfil não encontrado.');
  return profile;
}

export async function serveProfileMedia(
  request: ApiRequest,
  response: ApiResponse,
  rawUsername: string,
  rawKind: string,
): Promise<void> {
  const username = normalizedUsername(rawUsername);
  const parsedKind = profileMediaKindSchema.safeParse(rawKind);
  if (!username || !parsedKind.success) throw notFound('Imagem não encontrada.');
  const media = await findProfileMedia(username, parsedKind.data);
  if (!media?.path) throw notFound('Imagem não encontrada.');
  const viewer = await sessionUser(request);
  const owner = viewer?.id === media.userId;
  if (!media.isPublic && !owner) throw notFound('Imagem não encontrada.');
  if (viewer && !owner && (await hasBlockBetween(viewer.id, media.userId))) {
    throw notFound('Imagem não encontrada.');
  }
  const signedUrl = await signedProfileMediaUrl(media.path);
  response.statusCode = 302;
  response.setHeader('Cache-Control', 'private, max-age=60');
  response.setHeader('Location', signedUrl);
  response.end();
}

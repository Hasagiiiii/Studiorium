import { database } from '../../core/client.js';

const PROFILE_MEDIA_BUCKET = 'profile-media';

export async function uploadProfileMediaObject(
  path: string,
  bytes: Uint8Array,
  mime: string,
): Promise<void> {
  const result = await database().storage.from(PROFILE_MEDIA_BUCKET).upload(path, bytes, {
    contentType: mime,
    cacheControl: '3600',
    upsert: true,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function removeProfileMediaObject(path: string): Promise<void> {
  const result = await database().storage.from(PROFILE_MEDIA_BUCKET).remove([path]);
  if (result.error) throw new Error(result.error.message);
}

export async function signedProfileMediaUrl(path: string): Promise<string> {
  const result = await database().storage.from(PROFILE_MEDIA_BUCKET).createSignedUrl(path, 90);
  if (result.error || !result.data?.signedUrl) {
    throw new Error(result.error?.message || 'Não foi possível assinar a imagem de perfil.');
  }
  return result.data.signedUrl;
}

const { db, fail } = require('../db');
const { requireUser, currentUser, publicUser } = require('../auth');
const { readJson } = require('../http');
const { validateCoverImage } = require('./publications');

const TYPES = [
  'estudante',
  'universitario',
  'professor',
  'pesquisador',
  'designer',
  'instituicao',
  'criador',
  'jornalista',
  'comunicador',
  'monitor',
  'tecnico',
  'profissional',
  'autodidata',
  'internauta',
];
const MEDIA_KINDS = new Set(['avatar', 'cover']);
const PROFILE_MEDIA_BUCKET = 'profile-media';

function mediaColumn(kind) {
  if (!MEDIA_KINDS.has(kind)) {
    throw Object.assign(new Error('Tipo de imagem de perfil inválido.'), { statusCode: 400 });
  }
  return kind === 'avatar' ? 'avatar_path' : 'cover_path';
}

async function updateProfile(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const { data: current, error } = await db()
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(error);
  if (!current) throw Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });
  const patch = {
    display_name:
      String(body.displayName || current.display_name)
        .trim()
        .slice(0, 80) || current.display_name,
    bio: String(body.bio || '')
      .trim()
      .slice(0, 500),
    profile_type: TYPES.includes(body.profileType) ? body.profileType : current.profile_type,
    course: String(body.course ?? current.course ?? '')
      .trim()
      .slice(0, 160),
    institution: String(body.institution ?? current.institution ?? '')
      .trim()
      .slice(0, 160),
    education_level: String(body.educationLevel ?? current.education_level ?? '')
      .trim()
      .slice(0, 100),
  };
  if (!user.is_minor && typeof body.isPublic === 'boolean') patch.is_public = body.isPublic;
  const { error: updateError } = await db().from('profiles').update(patch).eq('user_id', user.id);
  fail(updateError);
  return { user: await publicUser(user) };
}

async function uploadProfileMedia(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const kind = String(body.kind || '');
  const column = mediaColumn(kind);
  const { data: current, error } = await db()
    .from('profiles')
    .select(`user_id,${column}`)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(error);
  if (!current) throw Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });

  const { ext, mime, bytes } = validateCoverImage(body.file, 3 * 1024 * 1024);
  const storagePath = `${user.id}/${kind}${ext}`;
  const previousPath = current[column] || null;
  const { error: uploadError } = await db().storage.from(PROFILE_MEDIA_BUCKET).upload(storagePath, bytes, {
    contentType: mime,
    cacheControl: '3600',
    upsert: true,
  });
  fail(uploadError);

  const { error: updateError } = await db()
    .from('profiles')
    .update({ [column]: storagePath })
    .eq('user_id', user.id);
  if (updateError) {
    await db().storage.from(PROFILE_MEDIA_BUCKET).remove([storagePath]);
    fail(updateError);
  }

  if (previousPath && previousPath !== storagePath) {
    const { error: cleanupError } = await db().storage.from(PROFILE_MEDIA_BUCKET).remove([previousPath]);
    if (cleanupError) console.warn('[Studiorium profile media cleanup]', cleanupError.message || cleanupError);
  }

  return { user: await publicUser(user), message: kind === 'avatar' ? 'Foto de perfil atualizada.' : 'Foto de capa atualizada.' };
}

async function removeProfileMedia(req, kind) {
  const user = await requireUser(req);
  const column = mediaColumn(kind);
  const { data: current, error } = await db()
    .from('profiles')
    .select(`user_id,${column}`)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(error);
  if (!current) throw Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });

  const currentPath = current[column] || null;
  const { error: updateError } = await db()
    .from('profiles')
    .update({ [column]: null })
    .eq('user_id', user.id);
  fail(updateError);

  if (currentPath) {
    const { error: removeError } = await db().storage.from(PROFILE_MEDIA_BUCKET).remove([currentPath]);
    if (removeError) console.warn('[Studiorium profile media remove]', removeError.message || removeError);
  }

  return { user: await publicUser(user), message: 'Imagem removida.' };
}

async function serveProfileMedia(req, res, username, kind) {
  const column = mediaColumn(kind);
  const { data: profile, error } = await db()
    .from('profiles')
    .select(`user_id,is_public,${column}`)
    .eq('username', username)
    .maybeSingle();
  fail(error);
  if (!profile?.[column]) {
    throw Object.assign(new Error('Imagem não encontrada.'), { statusCode: 404 });
  }

  const user = await currentUser(req);
  const isOwner = user?.id === profile.user_id;
  if (!profile.is_public && !isOwner) {
    throw Object.assign(new Error('Imagem não encontrada.'), { statusCode: 404 });
  }

  const { data: signed, error: signedError } = await db()
    .storage.from(PROFILE_MEDIA_BUCKET)
    .createSignedUrl(profile[column], 90);
  fail(signedError);
  res.statusCode = 302;
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.setHeader('Location', signed.signedUrl);
  res.end();
  return null;
}

module.exports = {
  updateProfile,
  uploadProfileMedia,
  removeProfileMedia,
  serveProfileMedia,
};

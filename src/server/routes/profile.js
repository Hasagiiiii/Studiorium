const { db, fail } = require('../db');
const { requireUser, publicUser } = require('../auth');
const { readJson } = require('../http');

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
];

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
  };
  if (!user.is_minor && typeof body.isPublic === 'boolean') patch.is_public = body.isPublic;
  const { error: updateError } = await db().from('profiles').update(patch).eq('user_id', user.id);
  fail(updateError);
  return { user: await publicUser(user) };
}
module.exports = { updateProfile };

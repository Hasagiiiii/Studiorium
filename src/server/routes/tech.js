const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const { safePublicName } = require('../public-identity');
const S = require('../serializers');
const hubs = new Set(['Tecnologia', 'Jogos', 'PC & Hardware', 'Carros', 'Motos']);

async function create(req) {
  const u = await requireUser(req),
    b = await readJson(req);
  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name,username')
    .eq('user_id', u.id)
    .maybeSingle();
  fail(profileError);
  const title = String(b.title || '')
    .trim()
    .slice(0, 180);
  if (title.length < 5) throw Object.assign(new Error('Título muito curto.'), { statusCode: 400 });
  const slug =
    (title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'recurso') +
    '-' +
    Date.now().toString(36);
  const row = {
    id: id('tec'),
    owner_id: u.id,
    author_name: safePublicName(profile?.display_name, profile?.username),
    title,
    slug,
    summary: String(b.summary || '').slice(0, 600),
    body: String(b.body || '').slice(0, 40000),
    hub: hubs.has(b.hub) ? b.hub : 'Tecnologia',
    category: String(b.category || 'Tutorial').slice(0, 80),
    tags: String(b.tags || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12),
    status: 'pending_review',
    created_at: now(),
    updated_at: now(),
  };
  const q = await db().from('tech_resources').insert(row).select('*').single();
  fail(q.error);
  return { resource: S.techResource(q.data), message: 'Enviado para revisão.' };
}

async function getPublic(slug) {
  const { data, error } = await db()
    .from('tech_resources')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  fail(error);
  if (!data) {
    throw Object.assign(new Error('Conteúdo da Oficina não encontrado.'), { statusCode: 404 });
  }
  return { resource: S.techResource(data) };
}

module.exports = { create, getPublic };

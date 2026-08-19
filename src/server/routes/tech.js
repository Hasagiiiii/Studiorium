const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now, slugify } = require('../security');
const { safePublicName } = require('../public-identity');
const S = require('../serializers');

const hubs = new Set(['Tecnologia', 'Jogos', 'PC & Hardware', 'Carros', 'Motos']);
const editableStatuses = new Set(['pending_review', 'rejected', 'hidden']);

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function resourceInput(body, current = {}) {
  const title = String(body.title ?? current.title ?? '')
    .trim()
    .slice(0, 180);

  if (title.length < 5) throw inputError('Título muito curto.');

  const rawTags = body.tags === undefined ? current.tags || [] : body.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  return {
    title,
    summary: String(body.summary ?? current.summary ?? '')
      .trim()
      .slice(0, 600),
    body: String(body.body ?? current.body ?? '')
      .trim()
      .slice(0, 40_000),
    hub: hubs.has(body.hub) ? body.hub : current.hub || 'Tecnologia',
    category: String(body.category ?? current.category ?? 'Tutorial')
      .trim()
      .slice(0, 80),
    tags: tags.slice(0, 12),
  };
}

function createSlug(title) {
  return `${slugify(title).slice(0, 70)}-${Date.now().toString(36)}`;
}

async function profileFor(userId) {
  const { data, error } = await db()
    .from('profiles')
    .select('display_name,username')
    .eq('user_id', userId)
    .maybeSingle();
  fail(error);
  return data;
}

async function ownedResource(userId, resourceId) {
  const { data, error } = await db()
    .from('tech_resources')
    .select('*')
    .eq('id', resourceId)
    .eq('owner_id', userId)
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Conteúdo da Oficina não encontrado.', 404);
  return data;
}

function ensureEditable(resource) {
  if (!editableStatuses.has(resource.status)) {
    throw inputError('Conteúdo publicado não pode ser alterado ou apagado por esta ação.', 409);
  }
}

async function create(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const values = resourceInput(body);
  const profile = await profileFor(user.id);
  const timestamp = now();
  const row = {
    id: id('tec'),
    owner_id: user.id,
    author_name: safePublicName(profile?.display_name, profile?.username),
    ...values,
    slug: createSlug(values.title),
    status: 'pending_review',
    created_at: timestamp,
    updated_at: timestamp,
  };
  const { data, error } = await db().from('tech_resources').insert(row).select('*').single();
  fail(error);
  return { resource: S.techResource(data), message: 'Enviado para revisão.' };
}

async function getMine(req, resourceId) {
  const user = await requireUser(req);
  const resource = await ownedResource(user.id, resourceId);
  ensureEditable(resource);
  return { resource: S.techResource(resource) };
}

async function update(req, resourceId) {
  const user = await requireUser(req);
  const current = await ownedResource(user.id, resourceId);
  ensureEditable(current);

  const body = await readJson(req);
  const values = resourceInput(body, current);
  const profile = await profileFor(user.id);
  const patch = {
    ...values,
    author_name: safePublicName(profile?.display_name, profile?.username),
    slug: values.title === current.title ? current.slug : createSlug(values.title),
    status: 'pending_review',
    featured: false,
    updated_at: now(),
  };
  const { data, error } = await db()
    .from('tech_resources')
    .update(patch)
    .eq('id', resourceId)
    .eq('owner_id', user.id)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Conteúdo da Oficina não encontrado.', 404);
  return {
    resource: S.techResource(data),
    message: 'Conteúdo atualizado e reenviado para revisão.',
  };
}

async function remove(req, resourceId) {
  const user = await requireUser(req);
  const current = await ownedResource(user.id, resourceId);
  ensureEditable(current);

  const { data, error } = await db()
    .from('tech_resources')
    .delete()
    .eq('id', resourceId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Conteúdo da Oficina não encontrado.', 404);
  return { ok: true, message: 'Conteúdo apagado definitivamente.' };
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
    throw inputError('Conteúdo da Oficina não encontrado.', 404);
  }
  return { resource: S.techResource(data) };
}

module.exports = {
  create,
  getMine,
  update,
  remove,
  getPublic,
  resourceInput,
};

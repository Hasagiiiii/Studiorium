const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now, slugify } = require('../security');
const { safePublicName } = require('../public-identity');
const {
  communityForContent,
  removeContentCommunity,
  setContentCommunity,
} = require('../community-links');
const { requireCommunityPermission } = require('../community-permissions');
const S = require('../serializers');

const hubs = new Set(['Tecnologia', 'Jogos', 'PC & Hardware', 'Carros', 'Motos']);
const editableStatuses = new Set(['pending_review', 'rejected', 'hidden', 'published']);

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

function communityInput(body) {
  const provided = Object.prototype.hasOwnProperty.call(body, 'communitySlug');
  return {
    provided,
    slug: provided
      ? String(body.communitySlug || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 80)
      : '',
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
    throw inputError('Este conteúdo não pode ser alterado enquanto está neste estado.', 409);
  }
}

async function participatingCommunity(req, slug) {
  if (!slug) return null;
  const actor = await requireCommunityPermission(req, slug, 'participate');
  return actor.community;
}

async function create(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const values = resourceInput(body);
  const communitySelection = communityInput(body);
  const community = communitySelection.slug
    ? await participatingCommunity(req, communitySelection.slug)
    : null;
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
  if (community) await setContentCommunity('tech_resource', data.id, community);
  return {
    resource: S.techResource(data),
    community,
    message: community ? `Enviado para revisão em ${community.name}.` : 'Enviado para revisão.',
  };
}

async function getMine(req, resourceId) {
  const user = await requireUser(req);
  const resource = await ownedResource(user.id, resourceId);
  ensureEditable(resource);
  const community = await communityForContent('tech_resource', resourceId);
  return { resource: S.techResource(resource), community };
}

async function update(req, resourceId) {
  const user = await requireUser(req);
  const current = await ownedResource(user.id, resourceId);
  ensureEditable(current);

  const currentCommunity = await communityForContent('tech_resource', resourceId);
  if (currentCommunity) {
    await requireCommunityPermission(req, currentCommunity.slug, 'participate');
  }

  const body = await readJson(req);
  const values = resourceInput(body, current);
  const communitySelection = communityInput(body);
  let community = currentCommunity;
  if (communitySelection.provided) {
    community = communitySelection.slug
      ? await participatingCommunity(req, communitySelection.slug)
      : null;
  }

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

  if (communitySelection.provided) {
    if (community) await setContentCommunity('tech_resource', resourceId, community);
    else await removeContentCommunity('tech_resource', resourceId);
  }

  return {
    resource: S.techResource(data),
    community,
    message:
      current.status === 'published'
        ? 'Alterações salvas. O conteúdo saiu do ar e voltou para revisão.'
        : 'Conteúdo atualizado e reenviado para revisão.',
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
  await removeContentCommunity('tech_resource', resourceId);
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
  const community = await communityForContent('tech_resource', data.id);
  return { resource: S.techResource(data), community };
}

module.exports = {
  create,
  getMine,
  update,
  remove,
  getPublic,
  resourceInput,
};

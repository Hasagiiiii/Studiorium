const { db, fail } = require('./db');
const { communityFromCatalog, normalizeSlug } = require('./community-catalog');

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function isMissingCommunitySchema(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /community_(members|content_links)|communities.*does not exist/i.test(message)
  );
}

function serializeCommunity(row, extra = {}) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    area: row.area || 'Geral',
    description: row.description || '',
    visibility: row.visibility || 'public',
    status: row.status || 'active',
    official: row.is_official !== false,
    rules: Array.isArray(row.rules) ? row.rules : [],
    createdAt: row.created_at || null,
    ...extra,
  };
}

async function resolveCommunity(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  const query = await db()
    .from('communities')
    .select('*')
    .eq('slug', normalized)
    .eq('status', 'active')
    .maybeSingle();

  if (query.error) {
    if (!isMissingCommunitySchema(query.error)) fail(query.error);
    const fallback = communityFromCatalog(normalized);
    if (!fallback) throw inputError('Comunidade não encontrada.', 404);
    return serializeCommunity(fallback, { storageReady: false });
  }

  if (!query.data) throw inputError('Comunidade não encontrada.', 404);
  return serializeCommunity(query.data, { storageReady: true });
}

async function removeContentCommunity(contentType, contentId) {
  const removal = await db()
    .from('community_content_links')
    .delete()
    .eq('content_type', String(contentType || '').trim())
    .eq('content_id', String(contentId || '').trim());

  if (removal.error) {
    if (isMissingCommunitySchema(removal.error)) return;
    fail(removal.error);
  }
}

async function setContentCommunity(contentType, contentId, community) {
  if (!community) return;
  if (community.storageReady === false) {
    throw inputError('As comunidades ainda não estão ativas no banco deste ambiente.', 503);
  }

  const cleanType = String(contentType || '').trim();
  const cleanId = String(contentId || '').trim();
  if (!cleanType || !cleanId) throw inputError('Vínculo de comunidade inválido.');

  await removeContentCommunity(cleanType, cleanId);
  const insertion = await db().from('community_content_links').insert({
    community_id: community.id,
    content_type: cleanType,
    content_id: cleanId,
    status: 'visible',
  });
  fail(insertion.error);
}

async function hiddenCommunityContentIds(contentType) {
  const type = String(contentType || '').trim();
  if (!type) return [];

  const query = await db()
    .from('community_content_links')
    .select('content_id')
    .eq('content_type', type)
    .eq('status', 'hidden');

  if (query.error) {
    if (isMissingCommunitySchema(query.error)) return [];
    fail(query.error);
  }
  return query.data.map((row) => row.content_id);
}

async function communityLinkForContent(contentType, contentId) {
  const link = await db()
    .from('community_content_links')
    .select('community_id,status,moderated_by,moderated_at')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .maybeSingle();

  if (link.error) {
    if (isMissingCommunitySchema(link.error)) return null;
    fail(link.error);
  }
  if (!link.data) return null;

  const community = await db()
    .from('communities')
    .select('*')
    .eq('id', link.data.community_id)
    .eq('status', 'active')
    .maybeSingle();
  if (community.error) {
    if (isMissingCommunitySchema(community.error)) return null;
    fail(community.error);
  }
  if (!community.data) return null;

  return {
    community: serializeCommunity(community.data, { storageReady: true }),
    status: link.data.status || 'visible',
    moderatedBy: link.data.moderated_by || null,
    moderatedAt: link.data.moderated_at || null,
  };
}

async function communityForContent(contentType, contentId) {
  const context = await communityLinkForContent(contentType, contentId);
  return context?.community || null;
}

module.exports = {
  inputError,
  isMissingCommunitySchema,
  serializeCommunity,
  resolveCommunity,
  removeContentCommunity,
  setContentCommunity,
  hiddenCommunityContentIds,
  communityLinkForContent,
  communityForContent,
};

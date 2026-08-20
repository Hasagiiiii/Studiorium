const { db, fail } = require('../db');
const { currentUser, requireUser } = require('../auth');
const S = require('../serializers');
const { OFFICIAL_COMMUNITIES, communityFromCatalog, normalizeSlug } = require('../community-catalog');
const {
  inputError,
  isMissingCommunitySchema,
  serializeCommunity,
  resolveCommunity,
} = require('../community-links');

function countByCommunity(rows = []) {
  return rows.reduce((counts, row) => {
    counts[row.community_id] = (counts[row.community_id] || 0) + 1;
    return counts;
  }, {});
}

function fallbackCommunities() {
  return OFFICIAL_COMMUNITIES.map((community) =>
    serializeCommunity(community, {
      memberCount: 0,
      joined: false,
      memberRole: null,
      storageReady: false,
    }),
  );
}

async function list(req) {
  const user = await currentUser(req);
  const communitiesQ = await db()
    .from('communities')
    .select('*')
    .eq('status', 'active')
    .order('area', { ascending: true })
    .order('name', { ascending: true });

  if (communitiesQ.error) {
    if (!isMissingCommunitySchema(communitiesQ.error)) fail(communitiesQ.error);
    return { communities: fallbackCommunities(), storageReady: false };
  }

  const [membersQ, mineQ] = await Promise.all([
    db().from('community_members').select('community_id').eq('status', 'active'),
    user
      ? db()
          .from('community_members')
          .select('community_id,role,status')
          .eq('user_id', user.id)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ]);
  fail(membersQ.error);
  fail(mineQ.error);

  const counts = countByCommunity(membersQ.data);
  const memberships = new Map(mineQ.data.map((row) => [row.community_id, row]));
  return {
    storageReady: true,
    communities: communitiesQ.data.map((row) => {
      const membership = memberships.get(row.id);
      return serializeCommunity(row, {
        memberCount: counts[row.id] || 0,
        joined: Boolean(membership),
        memberRole: membership?.role || null,
        storageReady: true,
      });
    }),
  };
}

async function detail(req, slug) {
  const user = await currentUser(req);
  const community = await resolveCommunity(slug);
  const fallback = communityFromCatalog(slug);

  if (community.storageReady === false) {
    return {
      community: { ...community, memberCount: 0, joined: false, memberRole: null },
      discussions: [],
      techResources: [],
      storageReady: false,
    };
  }

  const [membersQ, mineQ, linksQ] = await Promise.all([
    db().from('community_members').select('user_id').eq('community_id', community.id).eq('status', 'active'),
    user
      ? db()
          .from('community_members')
          .select('role,status')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    db()
      .from('community_content_links')
      .select('content_type,content_id,created_at')
      .eq('community_id', community.id)
      .order('created_at', { ascending: false }),
  ]);
  fail(membersQ.error);
  fail(mineQ.error);
  fail(linksQ.error);

  const discussionIds = linksQ.data
    .filter((link) => link.content_type === 'discussion')
    .map((link) => link.content_id)
    .slice(0, 40);

  const discussionsQ = discussionIds.length
    ? await db()
        .from('discussions')
        .select('*')
        .in('id', discussionIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
    : { data: [], error: null };
  fail(discussionsQ.error);

  const legacyHubs = fallback?.legacyHubs || [];
  const techQ = legacyHubs.length
    ? await db()
        .from('tech_resources')
        .select('id,owner_id,author_name,title,slug,summary,hub,category,tags,status,featured,created_at,updated_at')
        .in('hub', legacyHubs)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(16)
    : { data: [], error: null };
  fail(techQ.error);

  return {
    storageReady: true,
    community: {
      ...community,
      memberCount: membersQ.data.length,
      joined: Boolean(mineQ.data),
      memberRole: mineQ.data?.role || null,
    },
    discussions: discussionsQ.data.map(S.discussion),
    techResources: techQ.data.map(S.techResource),
  };
}

async function join(req, slug) {
  const user = await requireUser(req);
  const community = await resolveCommunity(slug);
  if (community.storageReady === false) {
    throw inputError('As comunidades ainda não estão ativas no banco deste ambiente.', 503);
  }

  const { error } = await db().from('community_members').upsert(
    {
      community_id: community.id,
      user_id: user.id,
      role: 'member',
      status: 'active',
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'community_id,user_id' },
  );
  fail(error);
  return { ok: true, message: `Você agora participa de ${community.name}.` };
}

async function leave(req, slug) {
  const user = await requireUser(req);
  const normalized = normalizeSlug(slug);
  const community = await resolveCommunity(normalized);
  if (community.storageReady === false) {
    throw inputError('As comunidades ainda não estão ativas no banco deste ambiente.', 503);
  }

  const membership = await db()
    .from('community_members')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(membership.error);
  if (!membership.data) return { ok: true, message: 'Você já não participava desta comunidade.' };
  if (membership.data.role !== 'member') {
    throw inputError('Membros com função de comunidade precisam transferir a função antes de sair.', 409);
  }

  const removal = await db()
    .from('community_members')
    .delete()
    .eq('community_id', community.id)
    .eq('user_id', user.id);
  fail(removal.error);
  return { ok: true, message: `Você saiu de ${community.name}.` };
}

module.exports = { list, detail, join, leave };

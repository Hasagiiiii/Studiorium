const { db, fail } = require('../db');
const { currentUser, requireUser } = require('../auth');
const { readJson } = require('../http');
const S = require('../serializers');
const { OFFICIAL_COMMUNITIES, normalizeSlug } = require('../community-catalog');
const {
  inputError,
  isMissingCommunitySchema,
  serializeCommunity,
  resolveCommunity,
} = require('../community-links');
const {
  permissionsFor,
  membershipFor,
  communityActor,
  requireCommunityPermission,
} = require('../community-permissions');

const TECH_RESOURCE_FIELDS =
  'id,owner_id,author_name,title,slug,summary,hub,category,tags,status,featured,created_at,updated_at';

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
      memberModerationStatus: null,
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
    db()
      .from('community_members')
      .select('community_id')
      .eq('status', 'active')
      .neq('moderation_status', 'removed'),
    user
      ? db()
          .from('community_members')
          .select('community_id,role,status,moderation_status')
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
        memberModerationStatus: membership?.moderation_status || null,
        storageReady: true,
      });
    }),
  };
}

async function detail(req, slug) {
  const user = await currentUser(req);
  const community = await resolveCommunity(slug);

  if (community.storageReady === false) {
    return {
      community: {
        ...community,
        memberCount: 0,
        joined: false,
        memberRole: null,
        memberModerationStatus: null,
      },
      discussions: [],
      techResources: [],
      permissions: [],
      storageReady: false,
    };
  }

  const [membersQ, mineQ, linksQ] = await Promise.all([
    db()
      .from('community_members')
      .select('user_id')
      .eq('community_id', community.id)
      .eq('status', 'active')
      .neq('moderation_status', 'removed'),
    user
      ? db()
          .from('community_members')
          .select('role,status,moderation_status')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
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
  const techResourceIds = linksQ.data
    .filter((link) => link.content_type === 'tech_resource')
    .map((link) => link.content_id)
    .slice(0, 40);

  const [discussionsQ, techQ] = await Promise.all([
    discussionIds.length
      ? db()
          .from('discussions')
          .select('*')
          .in('id', discussionIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    techResourceIds.length
      ? db()
          .from('tech_resources')
          .select(TECH_RESOURCE_FIELDS)
          .in('id', techResourceIds)
          .eq('status', 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(16)
      : Promise.resolve({ data: [], error: null }),
  ]);
  fail(discussionsQ.error);
  fail(techQ.error);

  const joined = mineQ.data?.status === 'active';
  const moderationStatus = mineQ.data?.moderation_status || null;
  const permissionRole = joined && moderationStatus === 'clear' ? mineQ.data?.role : null;
  return {
    storageReady: true,
    community: {
      ...community,
      memberCount: membersQ.data.length,
      joined,
      memberRole: joined ? mineQ.data?.role || null : null,
      memberModerationStatus: moderationStatus,
    },
    permissions: permissionsFor(permissionRole, user?.role === 'admin'),
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

  const existing = await membershipFor(community.id, user.id);
  if (existing?.moderation_status === 'removed') {
    throw inputError('Sua participação nesta comunidade foi removida pela moderação.', 403);
  }
  if (existing?.status === 'active') {
    return {
      ok: true,
      message:
        existing.moderation_status === 'muted'
          ? 'Você já participa, mas está temporariamente silenciado nesta comunidade.'
          : `Você já participa de ${community.name}.`,
    };
  }
  if (existing?.moderation_status === 'muted') {
    throw inputError('Aguarde a liberação da moderação antes de participar novamente.', 409);
  }

  const timestamp = new Date().toISOString();
  const membership = {
    community_id: community.id,
    user_id: user.id,
    role: 'member',
    status: 'active',
    moderation_status: 'clear',
    joined_at: existing?.joined_at || timestamp,
    updated_at: timestamp,
  };
  const { error } = await db()
    .from('community_members')
    .upsert(membership, { onConflict: 'community_id,user_id' });
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

  const membership = await membershipFor(community.id, user.id);
  if (!membership || membership.status === 'left') {
    return { ok: true, message: 'Você já não participava desta comunidade.' };
  }
  if (membership.role !== 'member') {
    throw inputError(
      'Membros com função de comunidade precisam transferir a função antes de sair.',
      409,
    );
  }

  const leaving = await db()
    .from('community_members')
    .update({ status: 'left', updated_at: new Date().toISOString() })
    .eq('community_id', community.id)
    .eq('user_id', user.id);
  fail(leaving.error);
  return { ok: true, message: `Você saiu de ${community.name}.` };
}

async function members(req, slug) {
  const actor = await communityActor(req, slug);
  if (
    !actor.permissions.includes('moderate_members') &&
    !actor.permissions.includes('manage_roles')
  ) {
    throw inputError('A lista de gestão é restrita à liderança e moderação da comunidade.', 403);
  }

  const memberships = await db()
    .from('community_members')
    .select('user_id,role,status,moderation_status,joined_at,updated_at')
    .eq('community_id', actor.community.id)
    .order('joined_at', { ascending: true });
  fail(memberships.error);

  const ids = memberships.data.map((item) => item.user_id);
  const profiles = ids.length
    ? await db()
        .from('profiles')
        .select('user_id,display_name,username,verification_status,verified_specialty')
        .in('user_id', ids)
    : { data: [], error: null };
  fail(profiles.error);
  const profileMap = new Map(profiles.data.map((profile) => [profile.user_id, profile]));

  return {
    community: actor.community,
    permissions: actor.permissions,
    members: memberships.data.map((membership) => {
      const profile = profileMap.get(membership.user_id) || {};
      return {
        userId: membership.user_id,
        displayName: profile.display_name || profile.username || 'Membro',
        role: membership.role,
        status: membership.status,
        moderationStatus: membership.moderation_status,
        joinedAt: membership.joined_at,
        verificationStatus: profile.verification_status || 'unverified',
        verifiedSpecialty: profile.verified_specialty || '',
      };
    }),
  };
}

async function updateMember(req, slug, targetUserId) {
  const actor = await communityActor(req, slug);
  const target = await membershipFor(actor.community.id, targetUserId);
  if (!target) throw inputError('Membro não encontrado nesta comunidade.', 404);
  if (target.user_id === actor.user.id && !actor.isAdmin) {
    throw inputError('Sua própria função deve ser transferida por outro responsável.', 409);
  }
  if (target.role === 'leader' && !actor.isAdmin) {
    throw inputError('Somente a administração do Studiorium pode alterar outro líder.', 403);
  }

  const body = await readJson(req);
  const patch = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(body, 'role')) {
    if (!actor.permissions.includes('manage_roles')) {
      throw inputError('Somente a liderança pode distribuir funções locais.', 403);
    }
    const role = String(body.role || '').trim();
    const allowed = actor.isAdmin
      ? ['member', 'moderator', 'curator', 'leader']
      : ['member', 'moderator', 'curator'];
    if (!allowed.includes(role)) throw inputError('Função de comunidade inválida.');
    if (
      role !== 'member' &&
      (target.status !== 'active' || target.moderation_status !== 'clear')
    ) {
      throw inputError('Ative e libere o membro antes de atribuir uma função de confiança.', 409);
    }
    patch.role = role;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'moderationStatus')) {
    if (!actor.permissions.includes('moderate_members')) {
      throw inputError('Você não pode moderar participantes desta comunidade.', 403);
    }
    const moderationStatus = String(body.moderationStatus || '').trim();
    if (!['clear', 'muted', 'removed'].includes(moderationStatus)) {
      throw inputError('Estado de moderação inválido.');
    }
    if (actor.role === 'moderator' && target.role !== 'member' && !actor.isAdmin) {
      throw inputError('Moderadores só podem agir sobre membros comuns.', 403);
    }
    patch.moderation_status = moderationStatus;
    if (moderationStatus === 'removed') {
      patch.status = 'left';
      patch.role = 'member';
    }
  }

  if (Object.keys(patch).length === 1) throw inputError('Nenhuma alteração válida foi enviada.');

  const updated = await db()
    .from('community_members')
    .update(patch)
    .eq('community_id', actor.community.id)
    .eq('user_id', targetUserId)
    .select('user_id,role,status,moderation_status,joined_at')
    .single();
  fail(updated.error);
  return { member: updated.data, message: 'Permissões da comunidade atualizadas.' };
}

async function updateCommunity(req, slug) {
  const actor = await requireCommunityPermission(req, slug, 'manage_rules');
  const body = await readJson(req);
  if (!Array.isArray(body.rules)) throw inputError('Envie as regras da comunidade em uma lista.');
  const rules = body.rules
    .map((rule) =>
      String(rule || '')
        .trim()
        .slice(0, 220),
    )
    .filter(Boolean)
    .slice(0, 12);

  const updated = await db()
    .from('communities')
    .update({ rules, updated_at: new Date().toISOString() })
    .eq('id', actor.community.id)
    .select('*')
    .single();
  fail(updated.error);
  return {
    community: serializeCommunity(updated.data, { storageReady: true }),
    message: 'Regras locais atualizadas.',
  };
}

module.exports = { list, detail, join, leave, members, updateMember, updateCommunity };

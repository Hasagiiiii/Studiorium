const { db, fail } = require('../db');
const { currentUser, publicUser, requireUser } = require('../auth');
const { hiddenCommunityContentIds } = require('../community-links');
const S = require('../serializers');
const { createNotification } = require('./notifications');

function notFound() {
  return Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });
}

function timeValue(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function profileByUsername(username) {
  const normalized = String(username || '')
    .trim()
    .toLowerCase();
  if (!normalized) throw notFound();

  const { data, error } = await db()
    .from('profiles')
    .select('user_id,username,display_name,is_public')
    .eq('username', normalized)
    .maybeSingle();
  fail(error);
  if (!data) throw notFound();
  return data;
}

async function followingIdsFor(userId) {
  if (!userId) return [];
  const { data, error } = await db()
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  fail(error);
  return data.map((row) => row.followed_id);
}

async function followingFeed(req) {
  const user = await requireUser(req);
  const followingIds = await followingIdsFor(user.id);
  if (!followingIds.length) return { feed: [] };

  const client = db();
  const [publicationsQ, discussionsQ, techQ, newsQ, projectsQ] = await Promise.all([
    client
      .from('publications')
      .select('*')
      .in('owner_id', followingIds)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30),
    client
      .from('discussions')
      .select('*')
      .in('author_id', followingIds)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30),
    client
      .from('tech_resources')
      .select('*')
      .in('owner_id', followingIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30),
    client
      .from('news_articles')
      .select('*')
      .in('contributor_id', followingIds)
      .eq('status', 'published')
      .not('certified_at', 'is', null)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(30),
    client
      .from('projects')
      .select('*')
      .in('user_id', followingIds)
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(30),
  ]);

  [publicationsQ, discussionsQ, techQ, newsQ, projectsQ].forEach((query) => fail(query.error));

  const hiddenDiscussionIds = new Set(await hiddenCommunityContentIds('discussion'));
  const feed = [
    ...publicationsQ.data.map((row) => ({
      type: 'publication',
      item: S.publication(row),
      at: row.published_at || row.created_at,
    })),
    ...discussionsQ.data
      .filter((row) => !hiddenDiscussionIds.has(row.id))
      .map((row) => ({ type: 'discussion', item: S.discussion(row), at: row.created_at })),
    ...techQ.data.map((row) => ({
      type: 'tech',
      item: S.techResource(row),
      at: row.updated_at || row.created_at,
    })),
    ...newsQ.data.map((row) => ({
      type: 'news',
      item: S.newsArticle(row),
      at: row.published_at || row.created_at,
    })),
    ...projectsQ.data.map((row) => ({
      type: 'project',
      item: S.publicProject(row),
      at: row.updated_at || row.created_at,
    })),
  ]
    .sort((a, b) => timeValue(b.at) - timeValue(a.at))
    .slice(0, 40);

  return { feed };
}

async function socialSummary(req, username) {
  const profile = await profileByUsername(username);
  const viewer = await currentUser(req);
  const isOwner = viewer?.id === profile.user_id;

  if (!profile.is_public && !isOwner) throw notFound();

  const viewerRelationQuery =
    viewer && !isOwner
      ? db()
          .from('user_follows')
          .select('follower_id')
          .eq('follower_id', viewer.id)
          .eq('followed_id', profile.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

  const [followersQ, followingQ, relationQ] = await Promise.all([
    db()
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', profile.user_id),
    db()
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.user_id),
    viewerRelationQuery,
  ]);

  fail(followersQ.error);
  fail(followingQ.error);
  fail(relationQ.error);

  return {
    userId: profile.user_id,
    username: profile.username,
    followerCount: Number(followersQ.count || 0),
    followingCount: Number(followingQ.count || 0),
    isFollowing: Boolean(relationQ.data),
    canFollow: Boolean(viewer && !isOwner && profile.is_public),
  };
}

async function notifyNewFollower(targetUserId, user) {
  try {
    const actor = await publicUser(user);
    await createNotification(targetUserId, {
      type: 'social.follow',
      title: `${actor.displayName} começou a seguir você`,
      message: `@${actor.username} agora acompanha suas publicações no Lorion.`,
      link: `/autores/${encodeURIComponent(actor.username)}`,
    });
  } catch (error) {
    console.warn('[Lorion follow notification]', error?.message || error);
  }
}

async function follow(req, username) {
  const user = await requireUser(req);
  const target = await profileByUsername(username);

  if (target.user_id === user.id) {
    throw Object.assign(new Error('Você não pode seguir o próprio perfil.'), { statusCode: 400 });
  }
  if (!target.is_public) {
    throw Object.assign(new Error('Este perfil não está disponível para novos seguidores.'), {
      statusCode: 403,
    });
  }

  const { error } = await db().from('user_follows').insert({
    follower_id: user.id,
    followed_id: target.user_id,
  });

  if (error && error.code !== '23505') fail(error);
  if (!error) await notifyNewFollower(target.user_id, user);

  return socialSummary(req, target.username);
}

async function unfollow(req, username) {
  const user = await requireUser(req);
  const target = await profileByUsername(username);

  if (target.user_id === user.id) {
    throw Object.assign(new Error('Você não pode deixar de seguir o próprio perfil.'), {
      statusCode: 400,
    });
  }

  const { error } = await db()
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followed_id', target.user_id);
  fail(error);

  if (!target.is_public) {
    return {
      userId: target.user_id,
      username: target.username,
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
      canFollow: false,
    };
  }

  return socialSummary(req, target.username);
}

module.exports = { followingIdsFor, followingFeed, socialSummary, follow, unfollow };

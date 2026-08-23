const { db, fail } = require('../db');
const { currentUser, publicUser, requireUser } = require('../auth');
const { createNotification } = require('./notifications');

function notFound() {
  return Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });
}

async function profileByUsername(username) {
  const normalized = String(username || '').trim().toLowerCase();
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

async function socialSummary(req, username) {
  const profile = await profileByUsername(username);
  const viewer = await currentUser(req);
  const isOwner = viewer?.id === profile.user_id;

  if (!profile.is_public && !isOwner) throw notFound();

  const relationQuery =
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
    relationQuery,
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

  if (!error) {
    const actor = await publicUser(user);
    await createNotification(target.user_id, {
      type: 'social.follow',
      title: `${actor.displayName} começou a seguir você`,
      message: `@${actor.username} agora acompanha suas publicações no Lorion.`,
      link: `/autores/${encodeURIComponent(actor.username)}`,
    });
  }

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
      isFollowing: false,
      canFollow: false,
    };
  }

  return socialSummary(req, target.username);
}

module.exports = { followingIdsFor, socialSummary, follow, unfollow };

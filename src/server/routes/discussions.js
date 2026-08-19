const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const { moderate } = require('../moderation');
const { buildReplyMap, rankRelatedDiscussions } = require('../comment-intelligence');
const S = require('../serializers');

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function discussionInput(body, current = {}) {
  const title = String(body.title ?? current.title ?? '')
    .trim()
    .slice(0, 180);
  const text = String(body.body ?? current.body ?? '')
    .trim()
    .slice(0, 12000);
  const category =
    String(body.category ?? current.category ?? 'Geral')
      .trim()
      .slice(0, 60) || 'Geral';
  const check = moderate(`${title}\n${text}`);
  if (!check.ok) throw inputError(check.message, 422);
  if (title.length < 6 || text.length < 10) {
    throw inputError('Escreva um título e uma descrição mais completos.');
  }
  return { title, body: text, category, reviewRequired: check.reviewRequired === true };
}

function replyInput(body, current = {}) {
  const text = String(body.body ?? current.body ?? '')
    .trim()
    .slice(0, 6000);
  const check = moderate(text);
  if (!check.ok) throw inputError(check.message, 422);
  if (text.length < 2) throw inputError('A resposta está vazia.');
  return { body: text, reviewRequired: check.reviewRequired === true };
}

async function profileName(user) {
  const { data, error } = await db()
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(error);
  return user.is_minor ? 'Membro protegido' : data?.display_name || 'Membro';
}

async function createDiscussion(req) {
  const user = await requireUser(req);
  const values = discussionInput(await readJson(req));
  const row = {
    id: id('disc'),
    author_id: user.id,
    author_name: await profileName(user),
    title: values.title,
    body: values.body,
    category: values.category,
    status: values.reviewRequired ? 'pending_review' : 'published',
    created_at: now(),
  };
  const { data, error } = await db().from('discussions').insert(row).select('*').single();
  fail(error);
  return {
    discussion: S.discussion(data),
    message:
      data.status === 'published'
        ? 'Discussão publicada.'
        : 'Discussão enviada para revisão da equipe.',
  };
}

async function ownedDiscussion(userId, discussionId) {
  const { data, error } = await db()
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .eq('author_id', userId)
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Discussão não encontrada.', 404);
  return data;
}

async function updateDiscussion(req, discussionId) {
  const user = await requireUser(req);
  const current = await ownedDiscussion(user.id, discussionId);
  const values = discussionInput(await readJson(req), current);
  const status =
    values.reviewRequired || current.status !== 'published' ? 'pending_review' : 'published';
  const patch = {
    title: values.title,
    body: values.body,
    category: values.category,
    status,
    author_name: await profileName(user),
  };
  const { data, error } = await db()
    .from('discussions')
    .update(patch)
    .eq('id', discussionId)
    .eq('author_id', user.id)
    .select('*')
    .single();
  fail(error);
  return {
    discussion: S.discussion(data),
    message: status === 'published' ? 'Discussão atualizada.' : 'Alterações enviadas para revisão.',
  };
}

async function deleteDiscussion(req, discussionId) {
  const user = await requireUser(req);
  await ownedDiscussion(user.id, discussionId);
  const { data, error } = await db()
    .from('discussions')
    .delete()
    .eq('id', discussionId)
    .eq('author_id', user.id)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Discussão não encontrada.', 404);
  return { ok: true, message: 'Discussão excluída definitivamente.' };
}

async function getThread(discussionId) {
  const discussionQ = await db()
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .eq('status', 'published')
    .maybeSingle();
  fail(discussionQ.error);
  if (!discussionQ.data) throw inputError('Discussão não encontrada.', 404);
  const [repliesQ, relatedQ] = await Promise.all([
    db()
      .from('replies')
      .select('*')
      .eq('discussion_id', discussionId)
      .eq('status', 'published')
      .order('created_at', { ascending: true }),
    db()
      .from('discussions')
      .select('*')
      .eq('status', 'published')
      .neq('id', discussionId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);
  fail(repliesQ.error);
  fail(relatedQ.error);

  const discussion = S.discussion(discussionQ.data);
  const replyMap = buildReplyMap(repliesQ.data.map(S.reply));
  const relatedDiscussions = rankRelatedDiscussions(discussion, relatedQ.data.map(S.discussion));

  return {
    discussion,
    replies: replyMap.replies,
    replyMap: {
      total: replyMap.total,
      questionCount: replyMap.questionCount,
      clusters: replyMap.clusters,
    },
    relatedDiscussions,
  };
}

async function createReply(req, discussionId) {
  const user = await requireUser(req);
  const { data: discussion, error: discussionError } = await db()
    .from('discussions')
    .select('id')
    .eq('id', discussionId)
    .eq('status', 'published')
    .maybeSingle();
  fail(discussionError);
  if (!discussion) throw inputError('Discussão não encontrada.', 404);
  const values = replyInput(await readJson(req));
  const row = {
    id: id('reply'),
    discussion_id: discussionId,
    author_id: user.id,
    author_name: await profileName(user),
    body: values.body,
    status: values.reviewRequired ? 'pending_review' : 'published',
    created_at: now(),
  };
  const { data, error } = await db().from('replies').insert(row).select('*').single();
  fail(error);
  return {
    reply: S.reply(data),
    message: data.status === 'published' ? 'Resposta publicada.' : 'Resposta enviada para revisão.',
  };
}

async function ownedReply(userId, replyId) {
  const { data, error } = await db()
    .from('replies')
    .select('*')
    .eq('id', replyId)
    .eq('author_id', userId)
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Resposta não encontrada.', 404);
  return data;
}

async function updateReply(req, replyId) {
  const user = await requireUser(req);
  const current = await ownedReply(user.id, replyId);
  const values = replyInput(await readJson(req), current);
  const status =
    values.reviewRequired || current.status !== 'published' ? 'pending_review' : 'published';
  const patch = { body: values.body, status, author_name: await profileName(user) };
  const { data, error } = await db()
    .from('replies')
    .update(patch)
    .eq('id', replyId)
    .eq('author_id', user.id)
    .select('*')
    .single();
  fail(error);
  return {
    reply: S.reply(data),
    message: status === 'published' ? 'Resposta atualizada.' : 'Alterações enviadas para revisão.',
  };
}

async function deleteReply(req, replyId) {
  const user = await requireUser(req);
  await ownedReply(user.id, replyId);
  const { data, error } = await db()
    .from('replies')
    .delete()
    .eq('id', replyId)
    .eq('author_id', user.id)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Resposta não encontrada.', 404);
  return { ok: true, message: 'Resposta excluída definitivamente.' };
}

module.exports = {
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  getThread,
  createReply,
  updateReply,
  deleteReply,
  discussionInput,
  replyInput,
};

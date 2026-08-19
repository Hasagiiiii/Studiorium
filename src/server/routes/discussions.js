const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const { moderate } = require('../moderation');
const { buildReplyMap, rankRelatedDiscussions } = require('../comment-intelligence');
const S = require('../serializers');

async function createDiscussion(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const title = String(body.title || '')
    .trim()
    .slice(0, 180);
  const text = String(body.body || '')
    .trim()
    .slice(0, 12000);
  const check = moderate(`${title}\n${text}`);
  if (!check.ok) throw Object.assign(new Error(check.message), { statusCode: 422 });
  if (title.length < 6 || text.length < 10)
    throw Object.assign(new Error('Escreva um título e uma descrição mais completos.'), {
      statusCode: 400,
    });
  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const row = {
    id: id('disc'),
    author_id: user.id,
    author_name: user.is_minor ? 'Membro protegido' : profile?.display_name || 'Membro',
    title,
    body: text,
    category:
      String(body.category || 'Geral')
        .trim()
        .slice(0, 60) || 'Geral',
    status: check.reviewRequired ? 'pending_review' : 'published',
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

async function getThread(discussionId) {
  const discussionQ = await db()
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .eq('status', 'published')
    .maybeSingle();
  fail(discussionQ.error);
  if (!discussionQ.data)
    throw Object.assign(new Error('Discussão não encontrada.'), { statusCode: 404 });
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
  if (!discussion) throw Object.assign(new Error('Discussão não encontrada.'), { statusCode: 404 });
  const body = await readJson(req);
  const text = String(body.body || '')
    .trim()
    .slice(0, 6000);
  const check = moderate(text);
  if (!check.ok) throw Object.assign(new Error(check.message), { statusCode: 422 });
  if (text.length < 2)
    throw Object.assign(new Error('A resposta está vazia.'), { statusCode: 400 });
  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const row = {
    id: id('reply'),
    discussion_id: discussionId,
    author_id: user.id,
    author_name: user.is_minor ? 'Membro protegido' : profile?.display_name || 'Membro',
    body: text,
    status: check.reviewRequired ? 'pending_review' : 'published',
    created_at: now(),
  };
  const { data, error } = await db().from('replies').insert(row).select('*').single();
  fail(error);
  return {
    reply: S.reply(data),
    message:
      data.status === 'published' ? 'Resposta publicada.' : 'Resposta enviada para revisão.',
  };
}

module.exports = { createDiscussion, getThread, createReply };

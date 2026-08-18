const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now, slugify } = require('../security');
const { moderate } = require('../moderation');
const { moderateNews } = require('../ai-news-moderation');
const S = require('../serializers');

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function cleanSources(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((source) => {
      const title = String(source?.title || '')
        .trim()
        .slice(0, 180);
      const url = String(source?.url || '')
        .trim()
        .slice(0, 1000);
      if (!title || !/^https?:\/\//i.test(url)) return null;
      return { title, url };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function cleanArticle(body, current = {}) {
  const article = {
    title: String(body.title ?? current.title ?? '')
      .trim()
      .slice(0, 180),
    summary: String(body.summary ?? current.summary ?? '')
      .trim()
      .slice(0, 1000),
    body: String(body.body ?? current.body ?? '')
      .trim()
      .slice(0, 60_000),
    category: String(body.category ?? current.category ?? 'Atualizações')
      .trim()
      .slice(0, 80),
    sources: body.sources === undefined ? current.sources || [] : cleanSources(body.sources),
  };
  const check = moderate(`${article.title}\n${article.summary}\n${article.body}`);
  if (!check.ok) throw inputError(check.message, 422);
  return article;
}

async function uniqueSlug(title, ignoredId = '') {
  const base = slugify(title);
  for (let number = 1; number < 1000; number += 1) {
    const slug = number === 1 ? base : `${base}-${number}`;
    let query = db().from('news_articles').select('id').eq('slug', slug);
    if (ignoredId) query = query.neq('id', ignoredId);
    const { data, error } = await query.maybeSingle();
    fail(error);
    if (!data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function getContributor(userId) {
  const { data, error } = await db()
    .from('news_contributors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  fail(error);
  return data;
}

async function contributor(req) {
  const user = await requireUser(req);
  return { contributor: S.newsContributor(await getContributor(user.id)) };
}

async function applyContributor(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const existing = await getContributor(user.id);
  if (existing?.status === 'approved') {
    throw inputError('Seu credenciamento já foi aprovado.', 409);
  }

  const row = {
    user_id: user.id,
    status: 'pending',
    area: String(body.area || '')
      .trim()
      .slice(0, 120),
    institution: String(body.institution || '')
      .trim()
      .slice(0, 180),
    portfolio_url: String(body.portfolioUrl || '')
      .trim()
      .slice(0, 1000),
    statement: String(body.statement || '')
      .trim()
      .slice(0, 2000),
    review_note: '',
    updated_at: now(),
    ...(existing ? {} : { created_at: now() }),
  };
  if (row.area.length < 3 || row.statement.length < 40) {
    throw inputError('Informe sua área e conte um pouco sobre sua experiência ou formação.');
  }
  if (row.portfolio_url && !/^https?:\/\//i.test(row.portfolio_url)) {
    throw inputError('O portfólio precisa ser um link válido.');
  }

  const { data, error } = await db()
    .from('news_contributors')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();
  fail(error);
  return { contributor: S.newsContributor(data) };
}

async function mine(req) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('news_articles')
    .select('*')
    .eq('contributor_id', user.id)
    .order('updated_at', { ascending: false });
  fail(error);
  return { articles: data.map(S.newsArticle) };
}

async function create(req) {
  const user = await requireUser(req);
  const application = await getContributor(user.id);
  if (user.role !== 'admin' && application?.status !== 'approved') {
    throw inputError('Seu credenciamento jornalístico precisa ser aprovado primeiro.', 403);
  }

  const body = await readJson(req);
  const article = cleanArticle(body);
  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const row = {
    id: id('news'),
    contributor_id: user.id,
    author_name: profile?.display_name || user.email.split('@')[0],
    ...article,
    slug: await uniqueSlug(article.title || 'noticia'),
    status: 'draft',
    ai_review_status: 'pending',
    ai_review: {},
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await db().from('news_articles').insert(row).select('*').single();
  fail(error);
  return { article: S.newsArticle(data) };
}

async function ownedArticle(user, articleId, includeDeleted = false) {
  let query = db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  if (!includeDeleted) query = query.is('deleted_at', null);
  const { data, error } = await query.maybeSingle();
  fail(error);
  if (!data) throw inputError('Notícia não encontrada.', 404);
  return data;
}

async function update(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId);
  if (!['draft', 'changes_requested'].includes(current.status)) {
    throw inputError('A notícia não pode ser editada durante a revisão.', 409);
  }
  const body = await readJson(req);
  const article = cleanArticle(body, current);
  const patch = {
    ...article,
    slug:
      article.title === current.title ? current.slug : await uniqueSlug(article.title, articleId),
    status: 'draft',
    ai_review_status: 'pending',
    ai_review: {},
    updated_at: now(),
  };
  const { data, error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .eq('contributor_id', user.id)
    .select('*')
    .single();
  fail(error);
  return { article: S.newsArticle(data) };
}

async function submit(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId);
  const application = await getContributor(user.id);
  if (user.role !== 'admin' && application?.status !== 'approved') {
    throw inputError('Seu credenciamento não está ativo.', 403);
  }
  if (!['draft', 'changes_requested'].includes(current.status)) {
    throw inputError('Esta notícia já está em análise.', 409);
  }
  if (current.title.length < 8 || current.summary.length < 50 || current.body.length < 240) {
    throw inputError('Complete o título, o resumo e o texto antes de enviar.');
  }
  if (!Array.isArray(current.sources) || current.sources.length < 2) {
    throw inputError('Inclua pelo menos duas fontes verificáveis.');
  }

  await db()
    .from('news_articles')
    .update({ status: 'ai_review', ai_review_status: 'pending', updated_at: now() })
    .eq('id', articleId);

  let review;
  let aiStatus;
  try {
    review = await moderateNews(current);
    aiStatus = review.decision;
  } catch (error) {
    review = {
      decision: 'unavailable',
      summary: 'A triagem automática ficou indisponível. A revisão humana continua obrigatória.',
      reviewedAt: now(),
      purpose: 'triage_only_human_certification_required',
    };
    aiStatus = 'unavailable';
    console.error('[Studiorium news triage]', error.message || error);
  }

  const { data, error } = await db()
    .from('news_articles')
    .update({
      status: 'editorial_review',
      ai_review_status: aiStatus,
      ai_review: review,
      updated_at: now(),
    })
    .eq('id', articleId)
    .eq('contributor_id', user.id)
    .select('*')
    .single();
  fail(error);
  return { article: S.newsArticle(data), message: 'Enviada para certificação editorial.' };
}

async function trash(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId);
  if (current.status === 'published') {
    throw inputError('Peça o arquivamento de uma notícia publicada à equipe editorial.', 409);
  }
  const { error } = await db()
    .from('news_articles')
    .update({ deleted_at: now(), updated_at: now() })
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true };
}

async function restore(req, articleId) {
  const user = await requireUser(req);
  await ownedArticle(user, articleId, true);
  const { error } = await db()
    .from('news_articles')
    .update({ deleted_at: null, updated_at: now() })
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true };
}

async function purge(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId, true);
  if (!current.deleted_at || current.status === 'published') {
    throw inputError('Mova o rascunho para a lixeira antes da exclusão definitiva.', 409);
  }
  const { error } = await db()
    .from('news_articles')
    .delete()
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true };
}

async function detail(slug) {
  const { data, error } = await db()
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('certified_at', 'is', null)
    .is('deleted_at', null)
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Notícia não encontrada.', 404);
  return { article: S.newsArticle(data) };
}

module.exports = {
  contributor,
  applyContributor,
  mine,
  create,
  update,
  submit,
  trash,
  restore,
  purge,
  detail,
};

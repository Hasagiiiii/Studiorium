const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now, slugify } = require('../security');
const { moderate } = require('../moderation');
const { moderateNews } = require('../news-moderation');
const { safePublicName } = require('../public-identity');
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
    .select('display_name,username')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const row = {
    id: id('news'),
    contributor_id: user.id,
    author_name: safePublicName(profile?.display_name, profile?.username),
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

async function hype(req, articleId) {
  const user = await requireUser(req);
  const { data: article, error: articleError } = await db()
    .from('news_articles')
    .select('id,contributor_id,status,certified_at,deleted_at,hypes')
    .eq('id', articleId)
    .maybeSingle();
  fail(articleError);
  if (!article || article.status !== 'published' || !article.certified_at || article.deleted_at) {
    throw inputError('Notícia não encontrada.', 404);
  }
  if (article.contributor_id === user.id) {
    throw inputError('Você não pode dar hype na própria notícia.', 409);
  }
  const { data: existing, error: existingError } = await db()
    .from('news_hypes')
    .select('article_id')
    .eq('article_id', articleId)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(existingError);
  if (existing) throw inputError('Você já deu hype nesta notícia.', 409);

  const { data: hypes, error } = await db().rpc('hype_news_article', {
    p_article_id: articleId,
    p_user_id: user.id,
  });
  fail(error);
  return { hypes: Number(hypes || article.hypes || 0), message: 'Hype registrado.' };
}

async function update(req, articleId) {
  const body = await readJson(req);
  if (body.action === 'hype') return hype(req, articleId);

  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId);
  if (['ai_review', 'editorial_review'].includes(current.status)) {
    throw inputError('A notícia está em revisão. Aguarde a decisão editorial antes de editar.', 409);
  }
  const article = cleanArticle(body, current);
  const wasPublic = current.status === 'published';
  const patch = {
    ...article,
    slug:
      article.title === current.title ? current.slug : await uniqueSlug(article.title, articleId),
    status: 'draft',
    featured: false,
    ai_review_status: 'pending',
    ai_review: {},
    certified_by: wasPublic ? null : current.certified_by,
    certified_at: wasPublic ? null : current.certified_at,
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
  return {
    article: S.newsArticle(data),
    message: wasPublic
      ? 'Alterações salvas. A notícia saiu do ar e precisa ser certificada novamente.'
      : 'Rascunho salvo.',
  };
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

  const review = moderateNews(current);
  const aiStatus = review.decision;

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
  if (['ai_review', 'editorial_review'].includes(current.status)) {
    throw inputError('A notícia está em revisão. Aguarde a decisão editorial antes de excluir.', 409);
  }
  const patch = {
    deleted_at: now(),
    featured: false,
    status: current.status === 'published' ? 'archived' : current.status,
    updated_at: now(),
  };
  const { error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true, message: 'Notícia movida para a sua lixeira privada.' };
}

async function restore(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId, true);
  if (!current.deleted_at) throw inputError('A notícia não está na lixeira.', 409);
  const patch = {
    deleted_at: null,
    status: current.status === 'archived' ? 'archived' : current.status,
    featured: false,
    updated_at: now(),
  };
  const { error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true, message: 'Notícia restaurada para o seu arquivo privado.' };
}

async function purge(req, articleId) {
  const user = await requireUser(req);
  const current = await ownedArticle(user, articleId, true);
  if (!current.deleted_at) {
    throw inputError('Mova a notícia para a lixeira antes da exclusão definitiva.', 409);
  }
  const { error } = await db()
    .from('news_articles')
    .delete()
    .eq('id', articleId)
    .eq('contributor_id', user.id);
  fail(error);
  return { ok: true, message: 'Notícia excluída definitivamente.' };
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
  hype,
  detail,
};

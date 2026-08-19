const { db, fail } = require('../db');
const { requireAdmin } = require('../auth');
const { readJson } = require('../http');
const { now } = require('../security');
const { audit } = require('../admin-audit');
const S = require('../serializers');

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

async function dashboard(req) {
  await requireAdmin(req);
  const [contributorsQ, articlesQ, templatesQ] = await Promise.all([
    db().from('news_contributors').select('*').order('updated_at', { ascending: false }),
    db().from('news_articles').select('*').order('updated_at', { ascending: false }).limit(300),
    db().from('custom_templates').select('*').order('updated_at', { ascending: false }).limit(300),
  ]);
  [contributorsQ, articlesQ, templatesQ].forEach((query) => fail(query.error));
  return {
    contributors: contributorsQ.data.map(S.newsContributor),
    articles: articlesQ.data.map(S.newsArticle),
    templates: templatesQ.data.map(S.customTemplate),
  };
}

async function updateContributor(req, userId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  if (!['pending', 'approved', 'rejected'].includes(body.status)) {
    throw inputError('Status de credenciamento inválido.');
  }
  const patch = {
    status: body.status,
    reviewer_id: admin.id,
    review_note: String(body.note || '')
      .trim()
      .slice(0, 1500),
    updated_at: now(),
  };
  const { data, error } = await db()
    .from('news_contributors')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Credenciamento não encontrado.', 404);
  await audit(admin, 'news.contributor.update', 'user', userId, patch);
  return { contributor: S.newsContributor(data) };
}

async function updateArticle(req, articleId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const { data: current, error: currentError } = await db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();
  fail(currentError);
  if (!current) throw inputError('Notícia não encontrada.', 404);

  const allowed = ['editorial_review', 'changes_requested', 'published', 'rejected', 'archived'];
  if (!allowed.includes(body.status)) throw inputError('Status editorial inválido.');
  const editorialNote = String(body.note || '')
    .trim()
    .slice(0, 2000);
  const patch = {
    status: body.status,
    editorial_note: editorialNote,
    updated_at: now(),
  };
  if (typeof body.featured === 'boolean') patch.featured = body.featured;

  if (body.status === 'published') {
    if (!Array.isArray(current.sources) || current.sources.length < 2) {
      throw inputError('A matéria precisa de pelo menos duas fontes antes da certificação.');
    }
    if (current.ai_review_status !== 'approved' && editorialNote.length < 20) {
      throw inputError('Explique a decisão humana ao publicar uma matéria sinalizada pela triagem.');
    }
    patch.certified_by = admin.id;
    patch.certified_at = now();
    patch.published_at = current.published_at || now();
    patch.deleted_at = null;
  } else if (body.status === 'archived') {
    patch.featured = false;
  } else {
    patch.certified_by = null;
    patch.certified_at = null;
  }

  const { data, error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .select('*')
    .single();
  fail(error);
  await audit(admin, 'news.article.update', 'news_article', articleId, patch);
  return { article: S.newsArticle(data) };
}

async function updateTemplate(req, templateId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  if (!['private', 'pending_review', 'published', 'rejected'].includes(body.status)) {
    throw inputError('Status do template inválido.');
  }
  const patch = { status: body.status, updated_at: now() };
  if (typeof body.featured === 'boolean') patch.featured = body.featured;
  if (body.status !== 'published') patch.featured = false;
  const { data, error } = await db()
    .from('custom_templates')
    .update(patch)
    .eq('id', templateId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw inputError('Template não encontrado.', 404);
  await audit(admin, 'custom_template.update', 'custom_template', templateId, patch);
  return { template: S.customTemplate(data) };
}

module.exports = { dashboard, updateContributor, updateArticle, updateTemplate };

const { db, fail } = require('../db');
const { requireAdmin } = require('../auth');
const { readJson } = require('../http');
const { now } = require('../security');
const { moderate } = require('../moderation');
const { audit } = require('../admin-audit');
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

function adminArticleInput(body, current) {
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
  if (article.title.length < 8 || article.summary.length < 50 || article.body.length < 240) {
    throw inputError('Complete o título, o resumo e o texto antes de salvar.');
  }
  if (current.status === 'published' && article.sources.length < 2) {
    throw inputError('Uma notícia publicada precisa manter pelo menos duas fontes verificáveis.');
  }
  return article;
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

async function trashArticle(req, articleId) {
  const admin = await requireAdmin(req);
  const { data: current, error: currentError } = await db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();
  fail(currentError);
  if (!current) throw inputError('Notícia não encontrada.', 404);
  if (current.deleted_at) {
    return { article: S.newsArticle(current), message: 'Notícia já está na lixeira.' };
  }

  const patch = {
    status: 'archived',
    featured: false,
    deleted_at: now(),
    updated_at: now(),
  };
  const { data, error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .select('*')
    .single();
  fail(error);
  await audit(admin, 'news.article.trash', 'news_article', articleId, {
    title: current.title,
    previousStatus: current.status,
  });
  return { article: S.newsArticle(data), message: 'Notícia movida para a lixeira.' };
}

async function restoreArticle(req, articleId) {
  const admin = await requireAdmin(req);
  const { data: current, error: currentError } = await db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();
  fail(currentError);
  if (!current) throw inputError('Notícia não encontrada.', 404);
  if (!current.deleted_at) throw inputError('A notícia não está na lixeira.', 409);

  const patch = { deleted_at: null, status: 'archived', featured: false, updated_at: now() };
  const { data, error } = await db()
    .from('news_articles')
    .update(patch)
    .eq('id', articleId)
    .select('*')
    .single();
  fail(error);
  await audit(admin, 'news.article.restore', 'news_article', articleId, { title: current.title });
  return {
    article: S.newsArticle(data),
    message: 'Notícia restaurada para o arquivo. Publique novamente quando desejar.',
  };
}

async function purgeArticle(req, articleId) {
  const admin = await requireAdmin(req);
  const { data: current, error: currentError } = await db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();
  fail(currentError);
  if (!current) throw inputError('Notícia não encontrada.', 404);
  if (!current.deleted_at) throw inputError('Mova a notícia para a lixeira antes de excluir.', 409);

  const { error } = await db().from('news_articles').delete().eq('id', articleId);
  fail(error);
  await audit(admin, 'news.article.delete', 'news_article', articleId, {
    title: current.title,
    status: current.status,
  });
  return { ok: true, message: 'Notícia excluída definitivamente.' };
}

async function updateArticle(req, articleId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);

  if (body.action === 'trash') return trashArticle(req, articleId);
  if (body.action === 'restore') return restoreArticle(req, articleId);
  if (body.action === 'purge') return purgeArticle(req, articleId);

  const { data: current, error: currentError } = await db()
    .from('news_articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();
  fail(currentError);
  if (!current) throw inputError('Notícia não encontrada.', 404);

  if (body.action === 'edit') {
    if (current.deleted_at) throw inputError('Restaure a notícia antes de editá-la.', 409);
    const patch = { ...adminArticleInput(body, current), updated_at: now() };
    const { data, error } = await db()
      .from('news_articles')
      .update(patch)
      .eq('id', articleId)
      .select('*')
      .single();
    fail(error);
    await audit(admin, 'news.article.edit', 'news_article', articleId, {
      title: patch.title,
      status: current.status,
    });
    return { article: S.newsArticle(data), message: 'Notícia atualizada.' };
  }

  const featureOnly = body.status === undefined && typeof body.featured === 'boolean';
  if (featureOnly) {
    if (current.status !== 'published' || !current.certified_at || current.deleted_at) {
      throw inputError('Somente notícias publicadas e certificadas podem receber destaque.');
    }
    const patch = { featured: body.featured, updated_at: now() };
    const { data, error } = await db()
      .from('news_articles')
      .update(patch)
      .eq('id', articleId)
      .select('*')
      .single();
    fail(error);
    await audit(admin, 'news.article.feature', 'news_article', articleId, patch);
    return { article: S.newsArticle(data) };
  }

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
      throw inputError(
        'Explique a decisão humana ao publicar uma matéria sinalizada pela triagem.',
      );
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

module.exports = {
  dashboard,
  updateContributor,
  updateArticle,
  trashArticle,
  restoreArticle,
  purgeArticle,
  updateTemplate,
};

import {
  createNewsDraft,
  createNotification,
  decideNewsContributor,
  decideNewsEditorial,
  findNewsContributor,
  findOwnedNews,
  listOwnedNews,
  purgeNews,
  restoreNews,
  softDeleteNews,
  submitNewsForEditorial,
  updateNewsDraft,
  upsertNewsContributorApplication,
  writeAdminAudit,
} from '@lorion/database';
import {
  applyNewsContributorInputSchema,
  newsArticleSchema,
  newsContributorDecisionInputSchema,
  newsContributorSchema,
  newsDeleteResultSchema,
  newsDraftInputSchema,
  newsEditorialDecisionInputSchema,
  newsWorkspaceSchema,
  type NewsArticle,
  type NewsContributor,
  type NewsDeleteResult,
  type NewsWorkspace,
} from '@lorion/contracts';
import { requirePermission } from '../../auth/authorization.js';
import { publicSessionUser, requireSessionUser } from '../../auth/session.js';
import { readJson } from '../../core/http/body.js';
import { badRequest, HttpError, notFound } from '../../core/http/errors.js';
import { triageNews } from '../../core/moderation/news.js';
import { analyzeText, assertPublishableText } from '../../core/moderation/text.js';
import type { ApiRequest } from '../../core/http/types.js';
import { entityId } from '../../core/security/token.js';

function decodeId(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

function safePortfolioUrl(value: string): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid');
    return url.toString().slice(0, 1000);
  } catch {
    throw badRequest('O portfólio precisa ser um link válido.');
  }
}

async function canWriteNews(userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true;
  return (await findNewsContributor(userId))?.status === 'approved';
}

export async function newsWorkspace(request: ApiRequest): Promise<NewsWorkspace> {
  const user = await requireSessionUser(request);
  const [contributor, articles, trash] = await Promise.all([
    findNewsContributor(user.id),
    listOwnedNews(user.id, false),
    listOwnedNews(user.id, true),
  ]);
  return newsWorkspaceSchema.parse({
    contributor,
    canWrite: user.role === 'admin' || contributor?.status === 'approved',
    articles,
    trash,
  });
}

export async function applyNewsContributor(request: ApiRequest): Promise<NewsContributor> {
  const user = await requireSessionUser(request);
  const existing = await findNewsContributor(user.id);
  if (existing?.status === 'approved') {
    throw new HttpError(409, 'Seu credenciamento editorial já está aprovado.', 'NEWS_CONTRIBUTOR_APPROVED');
  }
  const parsed = applyNewsContributorInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Informe sua área e uma apresentação mais completa.');
  assertPublishableText(parsed.data.statement, 'Credenciamento editorial');
  const contributor = await upsertNewsContributorApplication(user.id, {
    ...parsed.data,
    portfolioUrl: safePortfolioUrl(parsed.data.portfolioUrl),
  });
  return newsContributorSchema.parse(contributor);
}

export async function createNews(request: ApiRequest): Promise<NewsArticle> {
  const user = await requireSessionUser(request);
  if (!(await canWriteNews(user.id, user.role))) {
    throw new HttpError(403, 'Seu credenciamento editorial precisa estar aprovado.', 'NEWS_CONTRIBUTOR_REQUIRED');
  }
  const parsed = newsDraftInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados da notícia.');
  const publicUser = await publicSessionUser(request);
  return newsArticleSchema.parse(
    await createNewsDraft({
      id: entityId('news'),
      contributorId: user.id,
      authorName: publicUser?.displayName || publicUser?.username || 'Canal editorial',
      draft: parsed.data,
    }),
  );
}

export async function updateNews(
  request: ApiRequest,
  rawArticleId: string,
): Promise<NewsArticle> {
  const user = await requireSessionUser(request);
  if (!(await canWriteNews(user.id, user.role))) {
    throw new HttpError(403, 'Seu credenciamento editorial não está ativo.', 'NEWS_CONTRIBUTOR_REQUIRED');
  }
  const articleId = decodeId(rawArticleId);
  if (!articleId) throw notFound('Notícia não encontrada.');
  const parsed = newsDraftInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados da notícia.');
  const updated = await updateNewsDraft(articleId, user.id, parsed.data);
  if (!updated) {
    const current = await findOwnedNews(articleId, user.id);
    if (current && ['ai_review', 'editorial_review'].includes(current.status)) {
      throw new HttpError(409, 'A notícia está em revisão editorial.', 'NEWS_IN_REVIEW');
    }
    throw notFound('Notícia não encontrada.');
  }
  return newsArticleSchema.parse(updated);
}

export async function submitNews(request: ApiRequest, rawArticleId: string): Promise<NewsArticle> {
  const user = await requireSessionUser(request);
  if (!(await canWriteNews(user.id, user.role))) {
    throw new HttpError(403, 'Seu credenciamento editorial não está ativo.', 'NEWS_CONTRIBUTOR_REQUIRED');
  }
  const articleId = decodeId(rawArticleId);
  const current = articleId ? await findOwnedNews(articleId, user.id) : null;
  if (!current || current.deletedAt) throw notFound('Notícia não encontrada.');
  if (current.title.length < 8 || current.summary.length < 50 || current.body.length < 240) {
    throw badRequest('Complete o título, o resumo e o texto antes de enviar para revisão.');
  }
  if (current.sources.length < 2) throw badRequest('Inclua pelo menos duas fontes verificáveis.');

  const textAnalysis = analyzeText(`${current.title}\n${current.summary}\n${current.body}`);
  if (textAnalysis.decision === 'blocked') {
    throw new HttpError(422, 'A notícia acionou um bloqueio preventivo de segurança.', 'CONTENT_BLOCKED');
  }
  const draft = newsDraftInputSchema.parse({
    title: current.title,
    summary: current.summary,
    body: current.body,
    category: current.category,
    sources: current.sources,
  });
  const triage = triageNews(draft);
  const updated = await submitNewsForEditorial(
    articleId,
    user.id,
    triage.decision,
    triage as unknown as Record<string, unknown>,
  );
  if (!updated) throw new HttpError(409, 'A notícia já está em análise ou não pode ser enviada.', 'NEWS_NOT_SUBMITTED');
  return newsArticleSchema.parse(updated);
}

export async function deleteNews(request: ApiRequest, rawArticleId: string): Promise<NewsDeleteResult> {
  const user = await requireSessionUser(request);
  const articleId = decodeId(rawArticleId);
  if (!articleId || !(await softDeleteNews(articleId, user.id))) {
    throw new HttpError(409, 'Notícia não encontrada ou está em revisão.', 'NEWS_NOT_DELETED');
  }
  return newsDeleteResultSchema.parse({ ok: true, articleId });
}

export async function restoreDeletedNews(request: ApiRequest, rawArticleId: string): Promise<NewsDeleteResult> {
  const user = await requireSessionUser(request);
  const articleId = decodeId(rawArticleId);
  if (!articleId || !(await restoreNews(articleId, user.id))) throw notFound('Notícia não encontrada na lixeira.');
  return newsDeleteResultSchema.parse({ ok: true, articleId });
}

export async function purgeDeletedNews(request: ApiRequest, rawArticleId: string): Promise<NewsDeleteResult> {
  const user = await requireSessionUser(request);
  const articleId = decodeId(rawArticleId);
  if (!articleId || !(await purgeNews(articleId, user.id))) throw notFound('Notícia não encontrada na lixeira.');
  return newsDeleteResultSchema.parse({ ok: true, articleId });
}

export async function reviewNewsContributor(
  request: ApiRequest,
  rawUserId: string,
): Promise<NewsContributor> {
  const reviewer = await requirePermission(request, 'content.curate');
  const userId = decodeId(rawUserId);
  if (!userId) throw notFound('Solicitação não encontrada.');
  const parsed = newsContributorDecisionInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Decisão de credenciamento inválida.');
  const contributor = await decideNewsContributor(userId, reviewer.id, parsed.data);
  if (!contributor) throw notFound('Solicitação não encontrada ou já analisada.');
  await writeAdminAudit({
    adminId: reviewer.id,
    action: 'news.contributor',
    targetType: 'user',
    targetId: userId,
    details: parsed.data,
  });
  await createNotification({
    id: entityId('ntf'),
    userId,
    type: 'news',
    title: parsed.data.status === 'approved' ? 'Canal editorial aprovado' : 'Credenciamento editorial revisado',
    message:
      parsed.data.status === 'approved'
        ? 'Seu perfil agora pode criar notícias para certificação editorial.'
        : parsed.data.note || 'Seu pedido de credenciamento não foi aprovado nesta análise.',
    link: '/noticias/gerenciar',
  }).catch((cause) => console.error('[Lorion v4 news contributor notification]', cause));
  return newsContributorSchema.parse(contributor);
}

export async function reviewNewsArticle(
  request: ApiRequest,
  rawArticleId: string,
): Promise<NewsArticle> {
  const reviewer = await requirePermission(request, 'content.curate');
  const articleId = decodeId(rawArticleId);
  if (!articleId) throw notFound('Notícia não encontrada.');
  const parsed = newsEditorialDecisionInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Decisão editorial inválida.');
  const article = await decideNewsEditorial(articleId, reviewer.id, parsed.data);
  if (!article) throw notFound('Notícia não encontrada ou fora da fila editorial.');
  await writeAdminAudit({
    adminId: reviewer.id,
    action: 'news.editorial',
    targetType: 'news',
    targetId: articleId,
    details: parsed.data,
  });
  if (article.contributorId) {
    await createNotification({
      id: entityId('ntf'),
      userId: article.contributorId,
      type: 'news',
      title: parsed.data.status === 'published' ? 'Notícia certificada e publicada' : 'Revisão editorial atualizada',
      message:
        parsed.data.status === 'published'
          ? `“${article.title}” foi certificada pela equipe editorial.`
          : parsed.data.note || `“${article.title}” recebeu uma nova decisão editorial.`,
      link: parsed.data.status === 'published' ? `/noticias/${encodeURIComponent(article.slug)}` : '/noticias/gerenciar',
    }).catch((cause) => console.error('[Lorion v4 news review notification]', cause));
  }
  return newsArticleSchema.parse(article);
}

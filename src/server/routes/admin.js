const { db, fail } = require('../db');
const { requireAdmin } = require('../auth');
const { readJson } = require('../http');
const { now } = require('../security');
const { config } = require('../config');
const S = require('../serializers');

const settingKeys = new Set([
  'site_title',
  'hero_title',
  'hero_text',
  'site_notice',
  'registrations_open',
  'maintenance_mode',
]);

async function audit(admin, action, targetType = 'system', targetId = '', details = {}) {
  const { error } = await db()
    .from('admin_audit_log')
    .insert({
      admin_id: admin.id,
      action: String(action).slice(0, 100),
      target_type: String(targetType).slice(0, 80),
      target_id: String(targetId || '').slice(0, 160),
      details,
      created_at: now(),
    });
  if (error) console.error('[Studiorium audit]', error.message || error);
}

function settingsObject(rows = []) {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

async function enrichReports(rows) {
  const grouped = { publication: [], discussion: [], reply: [] };
  for (const row of rows)
    if (grouped[row.target_type]) grouped[row.target_type].push(row.target_id);
  const [pubsQ, discussionsQ, repliesQ] = await Promise.all([
    grouped.publication.length
      ? db()
          .from('publications')
          .select('id,title,abstract,status,author_name')
          .in('id', grouped.publication)
      : Promise.resolve({ data: [], error: null }),
    grouped.discussion.length
      ? db()
          .from('discussions')
          .select('id,title,body,status,author_name')
          .in('id', grouped.discussion)
      : Promise.resolve({ data: [], error: null }),
    grouped.reply.length
      ? db()
          .from('replies')
          .select('id,body,status,author_name,discussion_id')
          .in('id', grouped.reply)
      : Promise.resolve({ data: [], error: null }),
  ]);
  [pubsQ, discussionsQ, repliesQ].forEach((q) => fail(q.error));
  const maps = {
    publication: new Map(
      pubsQ.data.map((x) => [
        x.id,
        { title: x.title, excerpt: x.abstract, status: x.status, authorName: x.author_name },
      ]),
    ),
    discussion: new Map(
      discussionsQ.data.map((x) => [
        x.id,
        { title: x.title, excerpt: x.body, status: x.status, authorName: x.author_name },
      ]),
    ),
    reply: new Map(
      repliesQ.data.map((x) => [
        x.id,
        {
          title: 'Resposta no Colóquio',
          excerpt: x.body,
          status: x.status,
          authorName: x.author_name,
          discussionId: x.discussion_id,
        },
      ]),
    ),
  };
  return rows.map((row) => ({
    ...S.report(row),
    target: maps[row.target_type]?.get(row.target_id) || null,
  }));
}

async function dashboard(req) {
  await requireAdmin(req);
  const [usersQ, profilesQ, publicationsQ, discussionsQ, reportsQ, templatesQ, settingsQ, auditQ] =
    await Promise.all([
      db().from('users').select('*').order('created_at', { ascending: false }).limit(300),
      db().from('profiles').select('*').limit(500),
      db().from('publications').select('*').order('created_at', { ascending: false }).limit(300),
      db().from('discussions').select('*').order('created_at', { ascending: false }).limit(300),
      db().from('reports').select('*').order('created_at', { ascending: false }).limit(300),
      db()
        .from('templates')
        .select('*')
        .order('featured', { ascending: false })
        .order('downloads', { ascending: false }),
      db().from('site_settings').select('*'),
      db().from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
  [usersQ, profilesQ, publicationsQ, discussionsQ, reportsQ, templatesQ, settingsQ, auditQ].forEach(
    (q) => fail(q.error),
  );
  const profileMap = new Map(profilesQ.data.map((p) => [p.user_id, p]));
  const users = usersQ.data.map((u) => S.adminUser(u, profileMap.get(u.id)));
  const publications = publicationsQ.data.map(S.publication);
  const discussions = discussionsQ.data.map(S.discussion);
  const reports = await enrichReports(reportsQ.data);
  const templates = templatesQ.data.map(S.template);
  const metrics = {
    users: users.length,
    suspendedUsers: users.filter((u) => u.status === 'suspended').length,
    pendingPublications: publications.filter((p) => p.status === 'pending_review').length,
    publishedPublications: publications.filter((p) => p.status === 'published').length,
    openReports: reports.filter((r) => ['open', 'reviewing'].includes(r.status)).length,
    urgentReports: reports.filter(
      (r) => ['open', 'reviewing'].includes(r.status) && r.priority === 'urgent',
    ).length,
    discussions: discussions.filter((d) => d.status === 'published').length,
    templates: templates.length,
  };
  return {
    metrics,
    users,
    publications,
    discussions,
    reports,
    templates,
    settings: settingsObject(settingsQ.data),
    audit: auditQ.data.map((row) => ({
      id: row.id,
      adminId: row.admin_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      details: row.details || {},
      createdAt: row.created_at,
    })),
  };
}

async function queue(req) {
  await requireAdmin(req);
  const [reportsQ, publicationsQ] = await Promise.all([
    db()
      .from('reports')
      .select('*')
      .in('status', ['open', 'reviewing'])
      .order('created_at', { ascending: false }),
    db()
      .from('publications')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false }),
  ]);
  fail(reportsQ.error);
  fail(publicationsQ.error);
  const reports = (await enrichReports(reportsQ.data)).sort(
    (a, b) =>
      (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  return { reports, publications: publicationsQ.data.map(S.publication) };
}

async function updateReport(req, reportId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const patch = { updated_at: now() };
  if (['open', 'reviewing', 'resolved', 'dismissed'].includes(body.status))
    patch.status = body.status;
  if (['normal', 'urgent'].includes(body.priority)) patch.priority = body.priority;
  if (typeof body.note === 'string') patch.moderator_note = body.note.slice(0, 1500);
  const { data, error } = await db()
    .from('reports')
    .update(patch)
    .eq('id', reportId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Denúncia não encontrada.'), { statusCode: 404 });
  await audit(admin, 'report.update', 'report', reportId, patch);
  return { report: S.report(data) };
}

async function updatePublication(req, publicationId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const patch = {};
  if (['published', 'rejected', 'pending_review'].includes(body.status)) patch.status = body.status;
  if (typeof body.note === 'string') patch.moderation_note = body.note.slice(0, 1500);
  if (typeof body.featured === 'boolean') patch.featured = body.featured;
  if (patch.status === 'published') patch.published_at = now();
  const { data, error } = await db()
    .from('publications')
    .update(patch)
    .eq('id', publicationId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Publicação não encontrada.'), { statusCode: 404 });
  await audit(admin, 'publication.update', 'publication', publicationId, patch);
  return { publication: S.publication(data) };
}

async function updateContent(req, type, targetId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const configByType = {
    publication: { table: 'publications', allowed: ['published', 'rejected', 'pending_review'] },
    discussion: { table: 'discussions', allowed: ['published', 'hidden', 'pending_review'] },
    reply: { table: 'replies', allowed: ['published', 'hidden', 'pending_review'] },
  };
  const c = configByType[type];
  if (!c) throw Object.assign(new Error('Tipo de conteúdo inválido.'), { statusCode: 400 });
  if (!c.allowed.includes(body.status))
    throw Object.assign(new Error('Status inválido.'), { statusCode: 400 });
  const patch = { status: body.status };
  if (type === 'publication' && body.status === 'published') patch.published_at = now();
  const { data, error } = await db()
    .from(c.table)
    .update(patch)
    .eq('id', targetId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Conteúdo não encontrado.'), { statusCode: 404 });
  await audit(admin, 'content.status', type, targetId, patch);
  return { ok: true, status: body.status };
}

async function updateUser(req, userId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const { data: target, error: targetError } = await db()
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  fail(targetError);
  if (!target) throw Object.assign(new Error('Usuário não encontrado.'), { statusCode: 404 });
  const cfg = config();
  const protectedAdmin = cfg.adminEmail && target.email === cfg.adminEmail;
  const patch = {};
  if (body.role && ['user', 'admin'].includes(body.role)) {
    if (protectedAdmin && body.role !== 'admin')
      throw Object.assign(
        new Error('A conta administradora principal não pode perder a função de ADM.'),
        { statusCode: 400 },
      );
    if (target.id === admin.id && body.role !== 'admin')
      throw Object.assign(new Error('Você não pode remover sua própria permissão de ADM.'), {
        statusCode: 400,
      });
    patch.role = body.role;
  }
  if (body.status && ['active', 'suspended'].includes(body.status)) {
    if ((protectedAdmin || target.id === admin.id) && body.status === 'suspended')
      throw Object.assign(
        new Error('Essa conta administrativa não pode ser suspensa por esta ação.'),
        { statusCode: 400 },
      );
    patch.status = body.status;
    patch.suspension_reason =
      body.status === 'suspended'
        ? String(body.reason || '')
            .trim()
            .slice(0, 500)
        : '';
    patch.suspended_at = body.status === 'suspended' ? now() : null;
  }
  if (!Object.keys(patch).length)
    throw Object.assign(new Error('Nenhuma alteração válida informada.'), { statusCode: 400 });
  const { data, error } = await db()
    .from('users')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  fail(error);
  if (patch.status === 'suspended') await db().from('sessions').delete().eq('user_id', userId);
  const { data: profile } = await db()
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  await audit(admin, 'user.update', 'user', userId, {
    role: patch.role,
    status: patch.status,
    reason: patch.suspension_reason,
  });
  return { user: S.adminUser(data, profile) };
}

async function updateTemplate(req, templateId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const patch = {};
  if (typeof body.title === 'string' && body.title.trim())
    patch.title = body.title.trim().slice(0, 180);
  if (typeof body.category === 'string' && body.category.trim())
    patch.category = body.category.trim().slice(0, 80);
  if (typeof body.docType === 'string' && body.docType.trim())
    patch.doc_type = body.docType.trim().slice(0, 80);
  if (typeof body.style === 'string' && body.style.trim())
    patch.style = body.style.trim().slice(0, 80);
  if (typeof body.description === 'string')
    patch.description = body.description.trim().slice(0, 2000);
  if (typeof body.featured === 'boolean') patch.featured = body.featured;
  if (!Object.keys(patch).length)
    throw Object.assign(new Error('Nenhuma alteração válida informada.'), { statusCode: 400 });
  const { data, error } = await db()
    .from('templates')
    .update(patch)
    .eq('id', templateId)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Modelo não encontrado.'), { statusCode: 404 });
  await audit(admin, 'template.update', 'template', templateId, patch);
  return { template: S.template(data) };
}

async function updateSettings(req) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const rows = [];
  for (const [key, value] of Object.entries(body || {})) {
    if (!settingKeys.has(key)) continue;
    let clean = value;
    if (['registrations_open', 'maintenance_mode'].includes(key)) clean = value === true;
    else
      clean = String(value ?? '')
        .trim()
        .slice(0, key === 'hero_text' ? 1200 : 300);
    rows.push({ key, value: clean, updated_at: now() });
  }
  if (!rows.length)
    throw Object.assign(new Error('Nenhuma configuração válida informada.'), { statusCode: 400 });
  const { data, error } = await db()
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })
    .select('*');
  fail(error);
  await audit(
    admin,
    'settings.update',
    'system',
    'site_settings',
    Object.fromEntries(rows.map((r) => [r.key, r.value])),
  );
  return { settings: settingsObject(data) };
}

module.exports = {
  dashboard,
  queue,
  updateReport,
  updatePublication,
  updateContent,
  updateUser,
  updateTemplate,
  updateSettings,
};

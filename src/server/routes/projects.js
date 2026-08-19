const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const S = require('../serializers');

async function createProject(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  let template = null;
  if (body.templateSlug) {
    const q = await db()
      .from('templates')
      .select('*')
      .eq('slug', String(body.templateSlug))
      .maybeSingle();
    fail(q.error);
    template = q.data;
  }
  const row = {
    id: id('prj'),
    user_id: user.id,
    title:
      String(body.title || template?.title || 'Projeto sem título')
        .trim()
        .slice(0, 160) || 'Projeto sem título',
    template_id: template?.id || null,
    type: template?.doc_type || String(body.type || 'Documento acadêmico').slice(0, 80),
    visibility: 'private',
    sections: template
      ? (template.sections || []).map((name) => ({ name, content: '' }))
      : [
          { name: 'Introdução', content: '' },
          { name: 'Desenvolvimento', content: '' },
          { name: 'Conclusão', content: '' },
          { name: 'Referências', content: '' },
        ],
    notes: '',
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await db().from('projects').insert(row).select('*').single();
  fail(error);
  return { project: S.project(data) };
}

async function getProject(req, projectId) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { project: S.project(data) };
}

async function updateProject(req, projectId) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const patch = { updated_at: now() };
  if (typeof body.title === 'string')
    patch.title = body.title.trim().slice(0, 160) || 'Projeto sem título';
  if (Array.isArray(body.sections))
    patch.sections = body.sections.slice(0, 20).map((s) => ({
      name: String(s.name || 'Seção').slice(0, 80),
      content: String(s.content || '').slice(0, 30000),
    }));
  if (typeof body.notes === 'string') patch.notes = body.notes.slice(0, 10000);
  if (['private', 'public'].includes(body.visibility)) patch.visibility = body.visibility;
  const { data, error } = await db()
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { project: S.project(data) };
}

async function deleteProject(req, projectId) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('projects')
    .update({ deleted_at: now(), updated_at: now() })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { ok: true };
}

async function restoreProject(req, projectId) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('projects')
    .update({ deleted_at: null, updated_at: now() })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data)
    throw Object.assign(new Error('Projeto não encontrado na lixeira.'), { statusCode: 404 });
  return { ok: true };
}

async function purgeProject(req, projectId) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data)
    throw Object.assign(new Error('Projeto não encontrado na lixeira.'), { statusCode: 404 });
  return { ok: true };
}

module.exports = {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  restoreProject,
  purgeProject,
};

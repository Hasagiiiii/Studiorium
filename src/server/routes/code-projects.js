const { db, fail } = require('../db');
const { requireUser, currentUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const S = require('../serializers');

async function create(req) {
  const u = await requireUser(req),
    b = await readJson(req);
  const row = {
    id: id('code'),
    owner_id: u.id,
    title: String(b.title || 'Novo projeto').slice(0, 160),
    description: '',
    html: '<main>\n  <h1>Meu projeto</h1>\n  <p>Comece a criar.</p>\n</main>',
    css: 'body { font-family: system-ui; padding: 2rem; }',
    javascript: 'console.log("Studiorium Lab");',
    visibility: 'private',
    created_at: now(),
    updated_at: now(),
  };
  const q = await db().from('code_projects').insert(row).select('*').single();
  fail(q.error);
  return { project: S.codeProject(q.data) };
}

async function get(req, pid) {
  const u = await currentUser(req);
  const q = await db()
    .from('code_projects')
    .select('*')
    .eq('id', pid)
    .is('deleted_at', null)
    .maybeSingle();
  fail(q.error);

  const isOwner = Boolean(u && q.data?.owner_id === u.id);
  const isPublic = q.data?.visibility === 'public';
  if (!q.data || (!isOwner && !isPublic))
    throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });

  return { project: S.codeProject(q.data) };
}

async function update(req, pid) {
  const u = await requireUser(req),
    b = await readJson(req);
  const patch = { updated_at: now() };
  for (const [a, c, n] of [
    ['title', 'title', 160],
    ['description', 'description', 1000],
    ['html', 'html', 60000],
    ['css', 'css', 60000],
    ['javascript', 'javascript', 60000],
  ])
    if (typeof b[a] === 'string') patch[c] = b[a].slice(0, n);
  if (['private', 'public'].includes(b.visibility)) patch.visibility = b.visibility;
  const q = await db()
    .from('code_projects')
    .update(patch)
    .eq('id', pid)
    .eq('owner_id', u.id)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();
  fail(q.error);
  if (!q.data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { project: S.codeProject(q.data) };
}

async function trash(req, pid) {
  const u = await requireUser(req);
  const q = await db()
    .from('code_projects')
    .update({ deleted_at: now(), updated_at: now(), visibility: 'private' })
    .eq('id', pid)
    .eq('owner_id', u.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  fail(q.error);
  if (!q.data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { ok: true };
}

async function restore(req, pid) {
  const u = await requireUser(req);
  const q = await db()
    .from('code_projects')
    .update({ deleted_at: null, updated_at: now() })
    .eq('id', pid)
    .eq('owner_id', u.id)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  fail(q.error);
  if (!q.data)
    throw Object.assign(new Error('Projeto não encontrado na lixeira.'), { statusCode: 404 });
  return { ok: true };
}

async function purge(req, pid) {
  const u = await requireUser(req);
  const q = await db()
    .from('code_projects')
    .delete()
    .eq('id', pid)
    .eq('owner_id', u.id)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();
  fail(q.error);
  if (!q.data)
    throw Object.assign(new Error('Projeto não encontrado na lixeira.'), { statusCode: 404 });
  return { ok: true };
}

module.exports = { create, get, update, trash, restore, purge };

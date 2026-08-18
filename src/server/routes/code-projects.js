const { db, fail } = require('../db');
const { requireUser } = require('../auth');
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
    html: '<main>\\n  <h1>Meu projeto</h1>\\n  <p>Comece a criar.</p>\\n</main>',
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
  const u = await requireUser(req);
  const q = await db().from('code_projects').select('*').eq('id', pid).maybeSingle();
  fail(q.error);
  if (!q.data || (q.data.owner_id !== u.id && q.data.visibility !== 'public'))
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
    .select('*')
    .maybeSingle();
  fail(q.error);
  if (!q.data) throw Object.assign(new Error('Projeto não encontrado.'), { statusCode: 404 });
  return { project: S.codeProject(q.data) };
}
module.exports = { create, get, update };

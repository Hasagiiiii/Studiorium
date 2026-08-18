const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const S = require('../serializers');

const categories = ['odio','racismo','xenofobia','sexismo','machismo','assedio','bullying','conteudo_sexual','risco_menor','dados_pessoais','plagio','spam','golpe','violencia','outro'];

async function targetExists(type, targetId) {
  const map = { discussion: ['discussions', 'status'], reply: ['replies', 'status'], publication: ['publications', 'status'] };
  const entry = map[type];
  if (!entry) return false;
  const { data, error } = await db().from(entry[0]).select('id,status').eq('id', targetId).maybeSingle();
  fail(error);
  return Boolean(data && data.status === 'published');
}

async function createReport(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  if (!categories.includes(body.category)) throw Object.assign(new Error('Categoria de denúncia inválida.'), { statusCode: 400 });
  const targetType = String(body.targetType || '').slice(0, 40);
  const targetId = String(body.targetId || '').slice(0, 100);
  if (!targetType || !targetId) throw Object.assign(new Error('Alvo da denúncia ausente.'), { statusCode: 400 });
  if (!(await targetExists(targetType, targetId))) throw Object.assign(new Error('O conteúdo denunciado não foi encontrado ou não está público.'), { statusCode: 404 });
  const { data: duplicate, error: duplicateError } = await db().from('reports').select('id').eq('reporter_id', user.id).eq('target_type', targetType).eq('target_id', targetId).in('status', ['open','reviewing']).maybeSingle();
  fail(duplicateError);
  if (duplicate) throw Object.assign(new Error('Você já possui uma denúncia aberta para este conteúdo.'), { statusCode: 409 });
  const row = {
    id: id('rep'), reporter_id: user.id, target_type: targetType, target_id: targetId,
    category: body.category, description: String(body.description || '').trim().slice(0, 1500),
    status: 'open', priority: ['risco_menor','conteudo_sexual'].includes(body.category) ? 'urgent' : 'normal',
    created_at: now(), updated_at: now(),
  };
  const { data, error } = await db().from('reports').insert(row).select('*').single();
  fail(error); return { report: S.report(data) };
}
module.exports = { createReport };

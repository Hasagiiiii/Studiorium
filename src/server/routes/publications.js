const path = require('path');
const { db, fail } = require('../db');
const { requireUser, currentUser } = require('../auth');
const { readJson } = require('../http');
const { config } = require('../config');
const { id, now, slugify } = require('../security');
const { moderate } = require('../moderation');
const S = require('../serializers');

const allowedExt = new Set(['.pdf', '.docx', '.pptx', '.odt', '.txt']);
const allowedMime = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'text/plain',
  'application/octet-stream',
]);

async function uniqueSlug(title) {
  const base = slugify(title);
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data, error } = await db().from('publications').select('id').eq('slug', slug).maybeSingle();
    fail(error);
    if (!data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uploadFile(userId, publicationId, file) {
  if (!file?.dataBase64) return null;
  const fileName = String(file.name || 'arquivo').replace(/[\r\n]/g, '').slice(0, 120);
  const ext = path.extname(fileName).toLowerCase();
  if (!allowedExt.has(ext)) throw Object.assign(new Error('Tipo de arquivo não permitido.'), { statusCode: 400 });
  const mime = String(file.mime || 'application/octet-stream').slice(0, 120);
  if (!allowedMime.has(mime)) throw Object.assign(new Error('Formato de arquivo não permitido.'), { statusCode: 400 });
  let bytes;
  try { bytes = Buffer.from(String(file.dataBase64), 'base64'); }
  catch { throw Object.assign(new Error('Arquivo inválido.'), { statusCode: 400 }); }
  if (!bytes.length || bytes.length > config().maxUploadBytes) {
    throw Object.assign(new Error('O arquivo precisa ter até 5 MB.'), { statusCode: 413 });
  }
  const storagePath = `${userId}/${publicationId}${ext}`;
  const { error } = await db().storage.from('publications').upload(storagePath, bytes, {
    contentType: mime,
    upsert: false,
  });
  fail(error);
  return { file_path: storagePath, file_name: fileName, file_mime: mime };
}

async function createPublication(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const title = String(body.title || '').trim().slice(0, 180);
  const abstract = String(body.abstract || '').trim().slice(0, 5000);
  const content = String(body.content || '').trim().slice(0, 60000);
  const check = moderate(`${title}\n${abstract}\n${content}`);
  if (!check.ok) throw Object.assign(new Error(check.message), { statusCode: 422 });
  if (title.length < 6 || abstract.length < 40) throw Object.assign(new Error('Informe um título e um resumo mais completos.'), { statusCode: 400 });

  const { data: profile, error: profileError } = await db().from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
  fail(profileError);
  const publicationId = id('pub');
  let storedFile = null;
  try {
    storedFile = await uploadFile(user.id, publicationId, body.file);
    const row = {
      id: publicationId,
      owner_id: user.id,
      author_name: user.is_minor ? 'Autor protegido' : (profile?.display_name || user.email.split('@')[0]),
      title,
      slug: await uniqueSlug(title),
      abstract,
      content,
      area: String(body.area || 'Geral').trim().slice(0, 80) || 'Geral',
      level: String(body.level || 'Não informado').trim().slice(0, 80) || 'Não informado',
      keywords: String(body.keywords || '').split(',').map((k) => k.trim()).filter(Boolean).slice(0, 10),
      license: String(body.license || 'Todos os direitos reservados').slice(0, 80),
      status: user.role === 'admin' ? 'published' : 'pending_review',
      views: 0,
      downloads: 0,
      created_at: now(),
      published_at: user.role === 'admin' ? now() : null,
      ...(storedFile || {}),
    };
    const { data, error } = await db().from('publications').insert(row).select('*').single();
    fail(error);
    return { publication: S.publication(data), message: row.status === 'published' ? 'Publicado.' : 'Enviado para revisão.' };
  } catch (error) {
    if (storedFile?.file_path) await db().storage.from('publications').remove([storedFile.file_path]);
    throw error;
  }
}

async function downloadPublication(req, res, publicationId) {
  const { data: pub, error } = await db().from('publications').select('*').eq('id', publicationId).maybeSingle();
  fail(error);
  if (!pub?.file_path) throw Object.assign(new Error('Arquivo não encontrado.'), { statusCode: 404 });
  const user = await currentUser(req);
  const allowed = pub.status === 'published' || (user && (user.id === pub.owner_id || user.role === 'admin'));
  if (!allowed) throw Object.assign(new Error('Este arquivo ainda não é público.'), { statusCode: 403 });
  const { data: signed, error: signedError } = await db().storage.from('publications').createSignedUrl(pub.file_path, 60, { download: true });
  fail(signedError);
  await db().rpc('increment_publication_downloads', { p_id: pub.id });
  res.statusCode = 302;
  res.setHeader('Location', signed.signedUrl);
  res.end();
  return null;
}

async function registerView(publicationId) {
  const { data: pub, error } = await db().from('publications').select('id,status').eq('id', publicationId).maybeSingle();
  fail(error);
  if (!pub || pub.status !== 'published') throw Object.assign(new Error('Publicação não encontrada.'), { statusCode: 404 });
  const { error: updateError } = await db().rpc('increment_publication_views', { p_id: pub.id });
  fail(updateError);
  return { ok: true };
}

module.exports = { createPublication, downloadPublication, registerView };

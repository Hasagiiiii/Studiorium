const path = require('path');
const { db, fail } = require('../db');
const { requireUser, currentUser } = require('../auth');
const { readJson } = require('../http');
const { config } = require('../config');
const { id, now, slugify } = require('../security');
const { moderate } = require('../moderation');
const { safePublicName } = require('../public-identity');
const S = require('../serializers');

const GENERIC_MIME = 'application/octet-stream';
const allowedFiles = new Map([
  ['.pdf', new Set(['application/pdf', GENERIC_MIME])],
  [
    '.docx',
    new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      GENERIC_MIME,
    ]),
  ],
  [
    '.pptx',
    new Set([
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      GENERIC_MIME,
    ]),
  ],
  ['.odt', new Set(['application/vnd.oasis.opendocument.text', GENERIC_MIME])],
  ['.txt', new Set(['text/plain', GENERIC_MIME])],
]);

function fileError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function decodeBase64(value) {
  const encoded = String(value || '').trim();
  const isBase64 =
    encoded.length > 0 && encoded.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(encoded);

  if (!isBase64) throw fileError('Arquivo inválido.');

  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) {
    throw fileError('Arquivo inválido.');
  }
  return bytes;
}

function hasZipHeader(bytes) {
  return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from('PK\x03\x04'));
}

function matchesFileSignature(ext, bytes) {
  if (ext === '.pdf') {
    return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  if (ext === '.txt') {
    if (bytes.includes(0)) return false;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return true;
    } catch {
      return false;
    }
  }

  if (!hasZipHeader(bytes)) return false;
  const archiveText = bytes.toString('latin1');

  if (ext === '.docx') {
    return archiveText.includes('[Content_Types].xml') && archiveText.includes('word/');
  }

  if (ext === '.pptx') {
    return archiveText.includes('[Content_Types].xml') && archiveText.includes('ppt/');
  }

  return archiveText.includes('application/vnd.oasis.opendocument.text');
}

function validatePublicationFile(file, maxBytes) {
  const fileName = String(file?.name || 'arquivo')
    .replace(/[\r\n]/g, '')
    .slice(0, 120);
  const ext = path.extname(fileName).toLowerCase();
  const allowedMimes = allowedFiles.get(ext);
  if (!allowedMimes) throw fileError('Tipo de arquivo não permitido.');

  const mime = String(file?.mime || GENERIC_MIME).slice(0, 120);
  if (!allowedMimes.has(mime)) {
    throw fileError('Formato de arquivo não permitido.');
  }

  const bytes = decodeBase64(file?.dataBase64);
  if (bytes.length > maxBytes) {
    throw fileError('O arquivo precisa ter até 5 MB.', 413);
  }
  if (!matchesFileSignature(ext, bytes)) {
    throw fileError('O conteúdo do arquivo não corresponde ao formato informado.');
  }

  return { fileName, ext, mime, bytes };
}

async function uniqueSlug(title) {
  const base = slugify(title);
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data, error } = await db()
      .from('publications')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    fail(error);
    if (!data) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uploadFile(userId, publicationId, file) {
  if (!file?.dataBase64) return null;
  const { fileName, ext, mime, bytes } = validatePublicationFile(file, config().maxUploadBytes);
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
  const title = String(body.title || '')
    .trim()
    .slice(0, 180);
  const abstract = String(body.abstract || '')
    .trim()
    .slice(0, 5000);
  const content = String(body.content || '')
    .trim()
    .slice(0, 60000);
  const check = moderate(`${title}\n${abstract}\n${content}`);
  if (!check.ok) throw Object.assign(new Error(check.message), { statusCode: 422 });
  if (title.length < 6 || abstract.length < 40)
    throw Object.assign(new Error('Informe um título e um resumo mais completos.'), {
      statusCode: 400,
    });

  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name,username')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const publicationId = id('pub');
  let storedFile = null;
  try {
    storedFile = await uploadFile(user.id, publicationId, body.file);
    const row = {
      id: publicationId,
      owner_id: user.id,
      author_name: user.is_minor
        ? 'Autor protegido'
        : safePublicName(profile?.display_name, profile?.username),
      title,
      slug: await uniqueSlug(title),
      abstract,
      content,
      area:
        String(body.area || 'Geral')
          .trim()
          .slice(0, 80) || 'Geral',
      level:
        String(body.level || 'Não informado')
          .trim()
          .slice(0, 80) || 'Não informado',
      keywords: String(body.keywords || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 10),
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
    return {
      publication: S.publication(data),
      message: row.status === 'published' ? 'Publicado.' : 'Enviado para revisão.',
    };
  } catch (error) {
    if (storedFile?.file_path)
      await db().storage.from('publications').remove([storedFile.file_path]);
    throw error;
  }
}

async function downloadPublication(req, res, publicationId) {
  const { data: pub, error } = await db()
    .from('publications')
    .select('*')
    .eq('id', publicationId)
    .maybeSingle();
  fail(error);
  if (!pub?.file_path)
    throw Object.assign(new Error('Arquivo não encontrado.'), { statusCode: 404 });
  const user = await currentUser(req);
  const allowed =
    pub.status === 'published' || (user && (user.id === pub.owner_id || user.role === 'admin'));
  if (!allowed)
    throw Object.assign(new Error('Este arquivo ainda não é público.'), { statusCode: 403 });
  const { data: signed, error: signedError } = await db()
    .storage.from('publications')
    .createSignedUrl(pub.file_path, 60, { download: true });
  fail(signedError);
  await db().rpc('increment_publication_downloads', { p_id: pub.id });
  res.statusCode = 302;
  res.setHeader('Location', signed.signedUrl);
  res.end();
  return null;
}

async function registerView(publicationId) {
  const { data: pub, error } = await db()
    .from('publications')
    .select('id,status')
    .eq('id', publicationId)
    .maybeSingle();
  fail(error);
  if (!pub || pub.status !== 'published')
    throw Object.assign(new Error('Publicação não encontrada.'), { statusCode: 404 });
  const { error: updateError } = await db().rpc('increment_publication_views', { p_id: pub.id });
  fail(updateError);
  return { ok: true };
}

module.exports = {
  createPublication,
  downloadPublication,
  registerView,
  validatePublicationFile,
};

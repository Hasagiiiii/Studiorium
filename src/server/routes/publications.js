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
const allowedImages = new Map([
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.png', new Set(['image/png'])],
  ['.webp', new Set(['image/webp'])],
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

function matchesImageSignature(ext, bytes) {
  if (['.jpg', '.jpeg'].includes(ext))
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ext === '.png')
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  return (
    ext === '.webp' &&
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

function publicationInput(body, current = {}) {
  const title = String(body.title ?? current.title ?? '')
    .trim()
    .slice(0, 180);
  const abstract = String(body.abstract ?? current.abstract ?? '')
    .trim()
    .slice(0, 5000);
  const content = String(body.content ?? current.content ?? '')
    .trim()
    .slice(0, 60_000);
  const check = moderate(`${title}\n${abstract}\n${content}`);

  if (!check.ok) throw fileError(check.message, 422);
  if (title.length < 6 || abstract.length < 40) {
    throw fileError('Informe um título e um resumo mais completos.');
  }

  const rawKeywords = body.keywords === undefined ? current.keywords || [] : body.keywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords
    : String(rawKeywords || '')
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  return {
    title,
    abstract,
    content,
    area:
      String(body.area ?? current.area ?? 'Geral')
        .trim()
        .slice(0, 80) || 'Geral',
    level:
      String(body.level ?? current.level ?? 'Não informado')
        .trim()
        .slice(0, 80) || 'Não informado',
    keywords: keywords.slice(0, 10),
    license: String(body.license ?? current.license ?? 'Todos os direitos reservados').slice(0, 80),
  };
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

function validateCoverImage(file, maxBytes = 3 * 1024 * 1024) {
  const fileName = String(file?.name || 'capa')
    .replace(/[\r\n]/g, '')
    .slice(0, 120);
  const ext = path.extname(fileName).toLowerCase();
  const allowedMimes = allowedImages.get(ext);
  const mime = String(file?.mime || '').slice(0, 120);
  if (!allowedMimes?.has(mime)) throw fileError('Use uma foto JPG, PNG ou WebP.');
  const bytes = decodeBase64(file?.dataBase64);
  if (bytes.length > maxBytes) throw fileError('A foto precisa ter até 3 MB.', 413);
  if (!matchesImageSignature(ext, bytes))
    throw fileError('O conteúdo da foto não corresponde ao formato informado.');
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

async function uploadFile(userId, publicationId, file, upsert = false) {
  if (!file?.dataBase64) return null;
  const { fileName, ext, mime, bytes } = validatePublicationFile(file, config().maxUploadBytes);
  const storagePath = `${userId}/${publicationId}${ext}`;
  const { error } = await db().storage.from('publications').upload(storagePath, bytes, {
    contentType: mime,
    upsert,
  });
  fail(error);
  return { file_path: storagePath, file_name: fileName, file_mime: mime };
}

async function uploadCover(userId, publicationId, file, upsert = false) {
  if (!file?.dataBase64) return null;
  const { fileName, ext, mime, bytes } = validateCoverImage(file);
  const storagePath = `${userId}/${publicationId}-cover${ext}`;
  const { error } = await db().storage.from('publications').upload(storagePath, bytes, {
    contentType: mime,
    upsert,
  });
  fail(error);
  return { cover_path: storagePath, cover_name: fileName, cover_mime: mime };
}

async function removeStoredFile(filePath) {
  if (!filePath) return;
  const { error } = await db().storage.from('publications').remove([filePath]);
  if (error) console.error('[Studiorium publication file cleanup]', error.message || error);
}

async function createPublication(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const values = publicationInput(body);

  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('display_name,username')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  const publicationId = id('pub');
  let storedFile = null;
  let storedCover = null;
  try {
    storedFile = await uploadFile(user.id, publicationId, body.file);
    storedCover = await uploadCover(user.id, publicationId, body.cover);
    const row = {
      id: publicationId,
      owner_id: user.id,
      author_name: user.is_minor
        ? 'Autor protegido'
        : safePublicName(profile?.display_name, profile?.username),
      ...values,
      slug: await uniqueSlug(values.title),
      status: user.role === 'admin' ? 'published' : 'pending_review',
      views: 0,
      downloads: 0,
      created_at: now(),
      published_at: user.role === 'admin' ? now() : null,
      ...(storedFile || {}),
      ...(storedCover || {}),
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
    if (storedCover?.cover_path)
      await db().storage.from('publications').remove([storedCover.cover_path]);
    throw error;
  }
}

async function ownedPublication(userId, publicationId) {
  const { data, error } = await db()
    .from('publications')
    .select('*')
    .eq('id', publicationId)
    .eq('owner_id', userId)
    .maybeSingle();
  fail(error);
  if (!data) throw fileError('Publicação não encontrada.', 404);
  return data;
}

function ensurePublicationEditable(publication) {
  return publication;
}

async function getPublication(req, publicationId) {
  const user = await requireUser(req);
  const publication = await ownedPublication(user.id, publicationId);
  ensurePublicationEditable(publication);
  return { publication: S.publication(publication) };
}

async function updatePublication(req, publicationId) {
  const user = await requireUser(req);
  const current = await ownedPublication(user.id, publicationId);
  ensurePublicationEditable(current);

  const body = await readJson(req);
  const values = publicationInput(body, current);
  let storedFile = null;
  let storedCover = null;

  try {
    storedFile = await uploadFile(user.id, publicationId, body.file, true);
    storedCover = await uploadCover(user.id, publicationId, body.cover, true);
    const patch = {
      ...values,
      slug: values.title === current.title ? current.slug : await uniqueSlug(values.title),
      status: 'pending_review',
      featured: false,
      published_at: null,
      ...(storedFile || {}),
      ...(storedCover || {}),
    };
    const { data, error } = await db()
      .from('publications')
      .update(patch)
      .eq('id', publicationId)
      .eq('owner_id', user.id)
      .select('*')
      .maybeSingle();
    fail(error);
    if (!data) throw fileError('Publicação não encontrada.', 404);

    if (storedFile && current.file_path && current.file_path !== storedFile.file_path) {
      await removeStoredFile(current.file_path);
    }
    if (storedCover && current.cover_path && current.cover_path !== storedCover.cover_path) {
      await removeStoredFile(current.cover_path);
    }

    return {
      publication: S.publication(data),
      message:
        current.status === 'published'
          ? 'Alterações salvas. O trabalho saiu do ar e voltou para revisão.'
          : 'Trabalho atualizado e reenviado para revisão.',
    };
  } catch (error) {
    if (storedFile?.file_path && storedFile.file_path !== current.file_path) {
      await removeStoredFile(storedFile.file_path);
    }
    if (storedCover?.cover_path && storedCover.cover_path !== current.cover_path) {
      await removeStoredFile(storedCover.cover_path);
    }
    throw error;
  }
}

async function deletePublication(req, publicationId) {
  const user = await requireUser(req);
  const current = await ownedPublication(user.id, publicationId);
  ensurePublicationEditable(current);

  const { data, error } = await db()
    .from('publications')
    .delete()
    .eq('id', publicationId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle();
  fail(error);
  if (!data) throw fileError('Publicação não encontrada.', 404);
  await removeStoredFile(current.file_path);
  await removeStoredFile(current.cover_path);
  return { ok: true, message: 'Publicação apagada definitivamente.' };
}

async function serveCover(req, res, publicationId) {
  const { data: publication, error } = await db()
    .from('publications')
    .select('id,owner_id,status,cover_path')
    .eq('id', publicationId)
    .maybeSingle();
  fail(error);
  if (!publication?.cover_path)
    throw Object.assign(new Error('Foto não encontrada.'), { statusCode: 404 });
  const user = await currentUser(req);
  const staff = user && ['moderator', 'curator', 'editor', 'admin'].includes(user.role);
  if (publication.status !== 'published' && user?.id !== publication.owner_id && !staff)
    throw Object.assign(new Error('Esta foto ainda não é pública.'), { statusCode: 403 });
  const { data: signed, error: signedError } = await db()
    .storage.from('publications')
    .createSignedUrl(publication.cover_path, 60);
  fail(signedError);
  res.statusCode = 302;
  res.setHeader('Cache-Control', 'private, max-age=45');
  res.setHeader('Location', signed.signedUrl);
  res.end();
  return null;
}

async function boostPublication(req, publicationId) {
  const user = await requireUser(req);
  const { data: publication, error: publicationError } = await db()
    .from('publications')
    .select('id,owner_id,status,boosts')
    .eq('id', publicationId)
    .maybeSingle();
  fail(publicationError);
  if (!publication || publication.status !== 'published')
    throw Object.assign(new Error('Publicação não encontrada.'), { statusCode: 404 });
  if (publication.owner_id === user.id)
    throw Object.assign(new Error('Você não pode impulsionar sua própria publicação.'), {
      statusCode: 409,
    });
  const { data: existingBoost, error: boostError } = await db()
    .from('publication_boosts')
    .select('publication_id')
    .eq('publication_id', publicationId)
    .eq('user_id', user.id)
    .maybeSingle();
  fail(boostError);
  if (existingBoost)
    throw Object.assign(new Error('Você já impulsionou esta publicação.'), { statusCode: 409 });
  const { data: boosts, error } = await db().rpc('boost_publication', {
    p_publication_id: publicationId,
    p_user_id: user.id,
  });
  fail(error);
  return { boosts: Number(boosts || publication.boosts || 0), message: 'Publicação impulsionada.' };
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
  getPublication,
  updatePublication,
  deletePublication,
  downloadPublication,
  registerView,
  serveCover,
  boostPublication,
  validatePublicationFile,
  validateCoverImage,
  publicationInput,
};

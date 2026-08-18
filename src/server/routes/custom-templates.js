const path = require('path');
const { db, fail } = require('../db');
const { requireUser, currentUser } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const S = require('../serializers');

const IMAGE_MIMES = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.pdf', 'application/pdf'],
]);

function inputError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function defaultDocument() {
  return {
    settings: {
      background: '#f2eadb',
      textColor: '#2e2922',
      accentColor: '#8b6336',
      pageSize: 'A4',
    },
    blocks: [
      { id: id('block'), type: 'heading', content: 'Título do documento' },
      { id: id('block'), type: 'text', content: 'Comece a escrever e personalize livremente.' },
    ],
  };
}

function cleanDocument(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw inputError('Documento de template inválido.');
  }
  const settings = value.settings && typeof value.settings === 'object' ? value.settings : {};
  const color = (candidate, fallback) =>
    /^#[0-9a-f]{6}$/i.test(String(candidate || '')) ? candidate : fallback;
  const pageSize = ['A4', 'Carta', 'Apresentação'].includes(settings.pageSize)
    ? settings.pageSize
    : 'A4';
  const allowedTypes = new Set(['heading', 'text', 'quote', 'divider', 'image', 'reference']);
  const blocks = Array.isArray(value.blocks)
    ? value.blocks.slice(0, 80).map((block) => ({
        id: String(block?.id || id('block')).slice(0, 100),
        type: allowedTypes.has(block?.type) ? block.type : 'text',
        content: String(block?.content || '').slice(0, 20_000),
        alt: String(block?.alt || '').slice(0, 300),
        assetPath: String(block?.assetPath || '').slice(0, 500),
        src: '',
      }))
    : [];
  return {
    settings: {
      background: color(settings.background, '#f2eadb'),
      textColor: color(settings.textColor, '#2e2922'),
      accentColor: color(settings.accentColor, '#8b6336'),
      pageSize,
    },
    blocks,
  };
}

function decodeBase64(value) {
  const encoded = String(value || '').trim();
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw inputError('Arquivo inválido.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) throw inputError('Arquivo inválido.');
  return bytes;
}

function validSignature(extension, bytes) {
  if (extension === '.png') return bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  if (['.jpg', '.jpeg'].includes(extension)) {
    return (
      bytes.length > 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes.at(-2) === 0xff &&
      bytes.at(-1) === 0xd9
    );
  }
  if (extension === '.webp') {
    return (
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
}

async function signDocument(document) {
  const copy = structuredClone(document || defaultDocument());
  await Promise.all(
    (copy.blocks || []).map(async (block) => {
      if (!block.assetPath) return;
      const { data, error } = await db()
        .storage.from('template-assets')
        .createSignedUrl(block.assetPath, 3600);
      if (!error) block.src = data.signedUrl;
    }),
  );
  return copy;
}

async function serialized(row) {
  return S.customTemplate({ ...row, document: await signDocument(row.document) });
}

async function mine(req) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('custom_templates')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });
  fail(error);
  return { templates: await Promise.all(data.map(serialized)) };
}

async function create(req) {
  const user = await requireUser(req);
  const body = await readJson(req);
  const sourceType = ['editor', 'imported_image', 'imported_pdf', 'imported_json'].includes(
    body.sourceType,
  )
    ? body.sourceType
    : 'editor';
  const row = {
    id: id('tplx'),
    owner_id: user.id,
    title: String(body.title || 'Template sem título')
      .trim()
      .slice(0, 180),
    description: String(body.description || '')
      .trim()
      .slice(0, 2000),
    document: body.document ? cleanDocument(body.document) : defaultDocument(),
    source_type: sourceType,
    status: 'private',
    featured: false,
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await db().from('custom_templates').insert(row).select('*').single();
  fail(error);
  return { template: await serialized(data) };
}

async function find(req, templateId, includeDeleted = false) {
  const user = await currentUser(req);
  let query = db().from('custom_templates').select('*').eq('id', templateId);
  if (!includeDeleted) query = query.is('deleted_at', null);
  const { data, error } = await query.maybeSingle();
  fail(error);
  const allowed =
    data && (data.status === 'published' || user?.id === data.owner_id || user?.role === 'admin');
  if (!allowed) throw inputError('Template não encontrado.', 404);
  return { row: data, user };
}

async function get(req, templateId) {
  const { row } = await find(req, templateId);
  return { template: await serialized(row) };
}

async function update(req, templateId) {
  const user = await requireUser(req);
  const { row } = await find(req, templateId);
  if (row.owner_id !== user.id) throw inputError('Você não pode editar este template.', 403);
  const body = await readJson(req);
  const patch = { updated_at: now() };
  if (typeof body.title === 'string') patch.title = body.title.trim().slice(0, 180);
  if (typeof body.description === 'string')
    patch.description = body.description.trim().slice(0, 2000);
  if (body.document) patch.document = cleanDocument(body.document);
  if (body.submit === true) patch.status = 'pending_review';
  else if (row.status !== 'private') patch.status = 'private';
  const { data, error } = await db()
    .from('custom_templates')
    .update(patch)
    .eq('id', templateId)
    .eq('owner_id', user.id)
    .select('*')
    .single();
  fail(error);
  return { template: await serialized(data) };
}

async function uploadAsset(req, templateId) {
  const user = await requireUser(req);
  const { row } = await find(req, templateId);
  if (row.owner_id !== user.id) throw inputError('Você não pode alterar este template.', 403);
  const body = await readJson(req);
  const name = String(body.file?.name || 'arquivo')
    .replace(/[\r\n]/g, '')
    .slice(0, 120);
  const extension = path.extname(name).toLowerCase();
  const expectedMime = IMAGE_MIMES.get(extension);
  if (!expectedMime || body.file?.mime !== expectedMime) {
    throw inputError('Use PNG, JPG, WebP ou PDF.');
  }
  const bytes = decodeBase64(body.file?.dataBase64);
  if (bytes.length > 8 * 1024 * 1024) throw inputError('O arquivo precisa ter até 8 MB.', 413);
  if (!validSignature(extension, bytes)) throw inputError('O conteúdo do arquivo é inválido.');

  const assetPath = `${user.id}/${templateId}/${id('asset')}${extension}`;
  const { error } = await db().storage.from('template-assets').upload(assetPath, bytes, {
    contentType: expectedMime,
    upsert: false,
  });
  fail(error);
  const { data: signed, error: signedError } = await db()
    .storage.from('template-assets')
    .createSignedUrl(assetPath, 3600);
  fail(signedError);
  return {
    asset: {
      path: assetPath,
      src: signed.signedUrl,
      kind: extension === '.pdf' ? 'reference' : 'image',
      name,
    },
  };
}

async function trash(req, templateId) {
  const user = await requireUser(req);
  const { row } = await find(req, templateId);
  if (row.owner_id !== user.id) throw inputError('Você não pode excluir este template.', 403);
  const { error } = await db()
    .from('custom_templates')
    .update({ deleted_at: now(), featured: false, updated_at: now() })
    .eq('id', templateId)
    .eq('owner_id', user.id);
  fail(error);
  return { ok: true };
}

async function restore(req, templateId) {
  const user = await requireUser(req);
  const { row } = await find(req, templateId, true);
  if (row.owner_id !== user.id) throw inputError('Você não pode restaurar este template.', 403);
  const { error } = await db()
    .from('custom_templates')
    .update({ deleted_at: null, updated_at: now() })
    .eq('id', templateId)
    .eq('owner_id', user.id);
  fail(error);
  return { ok: true };
}

async function purge(req, templateId) {
  const user = await requireUser(req);
  const { row } = await find(req, templateId, true);
  if (row.owner_id !== user.id || !row.deleted_at) {
    throw inputError('Mova o template para a lixeira primeiro.', 409);
  }
  const { data: assets, error: listError } = await db()
    .storage.from('template-assets')
    .list(`${user.id}/${templateId}`, { limit: 100 });
  fail(listError);
  const paths = (assets || []).map((asset) => `${user.id}/${templateId}/${asset.name}`);
  if (paths.length) await db().storage.from('template-assets').remove(paths);
  const { error } = await db()
    .from('custom_templates')
    .delete()
    .eq('id', templateId)
    .eq('owner_id', user.id);
  fail(error);
  return { ok: true };
}

module.exports = { mine, create, get, update, uploadAsset, trash, restore, purge };

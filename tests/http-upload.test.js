const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY ||= 'test-secret';
process.env.STUDIORIUM_ADMIN_EMAIL ||= 'admin@example.com';

const { readJson } = require('../src/server/http');
const { validatePublicationFile } = require('../src/server/routes/publications');

function encoded(value) {
  return Buffer.from(value).toString('base64');
}

test('readJson converte JSON inválido em erro 400 também para body pré-processado', async () => {
  await assert.rejects(
    readJson({ body: '{inválido' }),
    (error) => error.statusCode === 400 && error.message === 'JSON inválido.',
  );
});

test('readJson aceita string, Buffer e objeto sem alterar o contrato', async () => {
  assert.deepEqual(await readJson({ body: '{"ok":true}' }), { ok: true });
  assert.deepEqual(await readJson({ body: Buffer.from('{"ok":true}') }), { ok: true });
  const body = { ok: true };
  assert.equal(await readJson({ body }), body);
});

test('upload valida Base64, MIME e assinatura real do arquivo', () => {
  const pdf = {
    name: 'trabalho.pdf',
    mime: 'application/pdf',
    dataBase64: encoded('%PDF-1.7\nconteúdo'),
  };
  const valid = validatePublicationFile(pdf, 1024);
  assert.equal(valid.ext, '.pdf');
  assert.equal(valid.bytes.subarray(0, 5).toString('ascii'), '%PDF-');

  assert.throws(
    () => validatePublicationFile({ ...pdf, dataBase64: 'não-base64' }, 1024),
    (error) => error.statusCode === 400 && error.message === 'Arquivo inválido.',
  );
  assert.throws(
    () => validatePublicationFile({ ...pdf, dataBase64: encoded('arquivo disfarçado') }, 1024),
    (error) => error.statusCode === 400 && error.message.includes('não corresponde'),
  );
  assert.throws(
    () => validatePublicationFile({ ...pdf, mime: 'text/plain' }, 1024),
    (error) => error.statusCode === 400 && error.message === 'Formato de arquivo não permitido.',
  );
});

test('upload de texto rejeita bytes binários e respeita o limite', () => {
  const textFile = {
    name: 'notas.txt',
    mime: 'text/plain',
    dataBase64: encoded('Texto acadêmico em UTF-8.'),
  };
  assert.equal(validatePublicationFile(textFile, 1024).ext, '.txt');

  assert.throws(
    () => validatePublicationFile({ ...textFile, dataBase64: encoded('a\0b') }, 1024),
    (error) => error.statusCode === 400,
  );
  assert.throws(
    () => validatePublicationFile(textFile, 4),
    (error) => error.statusCode === 413,
  );
});

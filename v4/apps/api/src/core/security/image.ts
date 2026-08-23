import type { ProfileMediaFile } from '@lorion/contracts';
import { badRequest, HttpError } from '../http/errors.js';

function extension(name: string): '.jpg' | '.jpeg' | '.png' | '.webp' | null {
  const match = name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
  return match ? (`.${match[1]}` as '.jpg' | '.jpeg' | '.png' | '.webp') : null;
}

function decodeCanonicalBase64(value: string): Uint8Array {
  const encoded = value.trim();
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw badRequest('Arquivo de imagem inválido.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) throw badRequest('Arquivo de imagem inválido.');
  return bytes;
}

function signatureMatches(ext: string, bytes: Uint8Array): boolean {
  if (ext === '.jpg' || ext === '.jpeg') {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (ext === '.png') {
    const expected = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return expected.every((value, index) => bytes[index] === value);
  }
  return (
    ext === '.webp' &&
    bytes.length >= 12 &&
    Buffer.from(bytes.slice(0, 4)).toString('ascii') === 'RIFF' &&
    Buffer.from(bytes.slice(8, 12)).toString('ascii') === 'WEBP'
  );
}

export function validateProfileImage(file: ProfileMediaFile, maxBytes = 3 * 1024 * 1024) {
  const ext = extension(file.name);
  if (!ext) throw badRequest('Use uma imagem JPG, PNG ou WebP.');
  const mimeByExt: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  if (mimeByExt[ext] !== file.mime) throw badRequest('O formato informado não corresponde ao arquivo.');
  const bytes = decodeCanonicalBase64(file.dataBase64);
  if (bytes.length > maxBytes) throw new HttpError(413, 'A imagem precisa ter até 3 MB.', 'FILE_TOO_LARGE');
  if (!signatureMatches(ext, bytes)) throw badRequest('O conteúdo da imagem não corresponde ao formato informado.');
  return { ext, mime: file.mime, bytes };
}

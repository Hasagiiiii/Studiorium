import type { ApiRequest } from './types.js';
import { badRequest, HttpError } from './errors.js';

const DEFAULT_LIMIT = 256 * 1024;

export async function readJson(
  request: ApiRequest,
  limit = DEFAULT_LIMIT,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limit)
      throw new HttpError(413, 'O conteúdo enviado é grande demais.', 'PAYLOAD_TOO_LARGE');
    chunks.push(buffer);
  }

  if (!chunks.length) return {};

  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw badRequest('Envie um objeto JSON válido.');
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw badRequest('JSON inválido.');
  }
}

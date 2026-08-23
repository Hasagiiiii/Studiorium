import { z } from 'zod';

export const nullableText = z.string().nullable();
export const optionalText = z.string().default('');
export const timestamp = z.string().nullable();

export const safeHttpUrl = z
  .string()
  .default('')
  .transform((value) => {
    const candidate = value.trim();
    if (!candidate) return '';
    try {
      const url = new URL(candidate);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
    } catch {
      return '';
    }
  });

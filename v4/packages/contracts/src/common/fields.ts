import { z } from 'zod';

export const nullableText = z.string().nullable();
export const optionalText = z.string().default('');
export const timestamp = z.string().nullable();

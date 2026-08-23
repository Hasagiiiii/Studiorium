import { z } from 'zod';
import { publicUserSchema } from '../bootstrap/schema.js';

export const authUserResponseSchema = z.object({
  user: publicUserSchema,
});

export const okResponseSchema = z.object({
  ok: z.boolean().default(true),
  message: z.string().optional(),
});

export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;
export type OkResponse = z.infer<typeof okResponseSchema>;

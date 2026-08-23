import { z } from 'zod';
import { optionalText } from '../common/fields.js';

export const communitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  area: z.string().default('Geral'),
  description: optionalText,
  visibility: z.string().default('public'),
  status: z.string().default('active'),
  official: z.boolean().default(false),
  rules: z.array(z.string()).default([]),
  memberCount: z.number().int().nonnegative().default(0),
  joined: z.boolean().default(false),
  role: z.string().nullable().default(null),
  memberModerationStatus: z.string().nullable().default(null),
});

export const communityMembershipResultSchema = z.object({
  communityId: z.string(),
  joined: z.boolean(),
  role: z.string().nullable(),
  memberModerationStatus: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
});

export type Community = z.infer<typeof communitySchema>;
export type CommunityMembershipResult = z.infer<typeof communityMembershipResultSchema>;

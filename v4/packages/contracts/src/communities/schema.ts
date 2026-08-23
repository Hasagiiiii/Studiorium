import { z } from 'zod';
import { optionalText } from '../common/fields.js';
import { discussionSchema } from '../discussions/schema.js';

export const communityMembershipStatusSchema = z
  .enum(['active', 'left', 'pending', 'rejected'])
  .nullable();

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
  membershipStatus: communityMembershipStatusSchema.default(null),
  role: z.string().nullable().default(null),
  memberModerationStatus: z.string().nullable().default(null),
});

export const communityMembershipResultSchema = z.object({
  communityId: z.string(),
  joined: z.boolean(),
  membershipStatus: communityMembershipStatusSchema,
  role: z.string().nullable(),
  memberModerationStatus: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
});

export const communityMembershipRequestSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  requestedAt: z.string().nullable(),
});

export const communityMembershipRequestsSchema = z.array(communityMembershipRequestSchema);

export const communityMemberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: z.string(),
  joinedAt: z.string().nullable(),
});

export const communityHubSchema = z.object({
  members: z.array(communityMemberSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  canCreateDiscussion: z.boolean().default(false),
});

export type Community = z.infer<typeof communitySchema>;
export type CommunityMembershipResult = z.infer<typeof communityMembershipResultSchema>;
export type CommunityMembershipRequest = z.infer<typeof communityMembershipRequestSchema>;
export type CommunityMember = z.infer<typeof communityMemberSchema>;
export type CommunityHub = z.infer<typeof communityHubSchema>;

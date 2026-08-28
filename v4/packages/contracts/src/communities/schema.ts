import { z } from 'zod';
import { optionalText } from '../common/fields.js';
import { discussionSchema } from '../discussions/schema.js';
import { socialPostSchema } from '../posts/schema.js';

export const communityVisibilitySchema = z.enum(['public', 'restricted', 'private']);
export const communityStatusSchema = z.enum(['active', 'archived']);
export const communityMembershipStatusSchema = z
  .enum(['active', 'left', 'pending', 'rejected'])
  .nullable();
export const communityMemberRoleSchema = z.enum(['member', 'moderator', 'curator', 'leader']);
export const communityMemberModerationStatusSchema = z
  .enum(['clear', 'muted', 'removed'])
  .nullable();

export const communitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  area: z.string().default('Geral'),
  description: optionalText,
  visibility: communityVisibilitySchema.default('public'),
  status: communityStatusSchema.default('active'),
  official: z.boolean().default(false),
  rules: z.array(z.string()).default([]),
  memberCount: z.number().int().nonnegative().default(0),
  joined: z.boolean().default(false),
  membershipStatus: communityMembershipStatusSchema.default(null),
  role: communityMemberRoleSchema.nullable().default(null),
  memberModerationStatus: communityMemberModerationStatusSchema.default(null),
});

export const communityMembershipResultSchema = z.object({
  communityId: z.string(),
  joined: z.boolean(),
  membershipStatus: communityMembershipStatusSchema,
  role: communityMemberRoleSchema.nullable(),
  memberModerationStatus: communityMemberModerationStatusSchema,
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
  role: communityMemberRoleSchema,
  joinedAt: z.string().nullable(),
});

export const communityHubSchema = z.object({
  members: z.array(communityMemberSchema).default([]),
  posts: z.array(socialPostSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  canCreateDiscussion: z.boolean().default(false),
});

export type CommunityVisibility = z.infer<typeof communityVisibilitySchema>;
export type CommunityStatus = z.infer<typeof communityStatusSchema>;
export type CommunityMemberRole = z.infer<typeof communityMemberRoleSchema>;
export type CommunityMemberModerationStatus = z.infer<typeof communityMemberModerationStatusSchema>;
export type Community = z.infer<typeof communitySchema>;
export type CommunityMembershipResult = z.infer<typeof communityMembershipResultSchema>;
export type CommunityMembershipRequest = z.infer<typeof communityMembershipRequestSchema>;
export type CommunityMember = z.infer<typeof communityMemberSchema>;
export type CommunityHub = z.infer<typeof communityHubSchema>;

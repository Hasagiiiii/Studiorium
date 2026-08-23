import { z } from 'zod';
import { optionalText } from '../common/fields.js';
import { discussionSchema } from '../discussions/schema.js';
import { socialPostSchema } from '../posts/schema.js';

export const communityVisibilitySchema = z.enum(['public', 'restricted', 'private']);
export const communityRoleSchema = z.enum(['member', 'moderator', 'curator', 'leader']);
export const communityModerationStatusSchema = z.enum(['clear', 'muted', 'removed']);
export const communityMembershipStatusSchema = z
  .enum(['active', 'left', 'pending', 'rejected'])
  .nullable();

export const communitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  area: z.string().default('Geral'),
  description: optionalText,
  visibility: communityVisibilitySchema.default('public'),
  status: z.string().default('active'),
  official: z.boolean().default(false),
  rules: z.array(z.string()).default([]),
  hasAvatar: z.boolean().default(false),
  hasCover: z.boolean().default(false),
  memberCount: z.number().int().nonnegative().default(0),
  joined: z.boolean().default(false),
  membershipStatus: communityMembershipStatusSchema.default(null),
  role: communityRoleSchema.nullable().default(null),
  memberModerationStatus: communityModerationStatusSchema.nullable().default(null),
});

export const createCommunityInputSchema = z.object({
  name: z.string().trim().min(3).max(100),
  area: z.string().trim().min(2).max(80).default('Geral'),
  description: z.string().trim().max(1200).default(''),
  visibility: communityVisibilitySchema.default('public'),
  rules: z.array(z.string().trim().min(2).max(300)).max(20).default([]),
});

export const updateCommunityInputSchema = createCommunityInputSchema;

export const communityMembershipResultSchema = z.object({
  communityId: z.string(),
  joined: z.boolean(),
  membershipStatus: communityMembershipStatusSchema,
  role: communityRoleSchema.nullable(),
  memberModerationStatus: communityModerationStatusSchema.nullable(),
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
  role: communityRoleSchema,
  joinedAt: z.string().nullable(),
});

export const communityManagedMemberSchema = communityMemberSchema.extend({
  status: z.enum(['active', 'left', 'pending', 'rejected']),
  moderationStatus: communityModerationStatusSchema,
});

export const communityHubSchema = z.object({
  members: z.array(communityMemberSchema).default([]),
  posts: z.array(socialPostSchema).default([]),
  discussions: z.array(discussionSchema).default([]),
  canCreateDiscussion: z.boolean().default(false),
});

export const communityManagementSchema = z.object({
  community: communitySchema,
  members: z.array(communityManagedMemberSchema).default([]),
  canEdit: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
  canTransferLeadership: z.boolean().default(false),
});

export const communityMemberUpdateInputSchema = z.object({
  role: z.enum(['member', 'moderator', 'curator']).optional(),
  moderationStatus: communityModerationStatusSchema.optional(),
});

export const communityLeadershipTransferInputSchema = z.object({
  userId: z.string().trim().min(1).max(120),
});

export const communityMediaKindSchema = z.enum(['avatar', 'cover']);
export const communityMediaUploadInputSchema = z.object({
  kind: communityMediaKindSchema,
  file: z.object({
    name: z.string().trim().min(1).max(120),
    mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    dataBase64: z.string().min(4),
  }),
});

export type CommunityVisibility = z.infer<typeof communityVisibilitySchema>;
export type CommunityRole = z.infer<typeof communityRoleSchema>;
export type CommunityModerationStatus = z.infer<typeof communityModerationStatusSchema>;
export type Community = z.infer<typeof communitySchema>;
export type CreateCommunityInput = z.infer<typeof createCommunityInputSchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunityInputSchema>;
export type CommunityMembershipResult = z.infer<typeof communityMembershipResultSchema>;
export type CommunityMembershipRequest = z.infer<typeof communityMembershipRequestSchema>;
export type CommunityMember = z.infer<typeof communityMemberSchema>;
export type CommunityManagedMember = z.infer<typeof communityManagedMemberSchema>;
export type CommunityHub = z.infer<typeof communityHubSchema>;
export type CommunityManagement = z.infer<typeof communityManagementSchema>;
export type CommunityMemberUpdateInput = z.infer<typeof communityMemberUpdateInputSchema>;
export type CommunityLeadershipTransferInput = z.infer<typeof communityLeadershipTransferInputSchema>;
export type CommunityMediaKind = z.infer<typeof communityMediaKindSchema>;
export type CommunityMediaUploadInput = z.infer<typeof communityMediaUploadInputSchema>;

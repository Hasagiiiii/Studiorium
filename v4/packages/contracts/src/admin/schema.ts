import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';
import { reportSchema } from '../moderation/schema.js';
import { newsArticleSchema, newsContributorSchema } from '../news/schema.js';
import { publicationSchema } from '../research/schema.js';

export const verificationRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileType: z.string(),
  course: optionalText,
  institution: optionalText,
  educationLevel: optionalText,
  specialty: optionalText,
  credentialReference: optionalText,
  statement: z.string(),
  status: z.string(),
  reviewerId: z.string().nullable().default(null),
  reviewNote: optionalText,
  reviewedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const submitVerificationInputSchema = z.object({
  course: z.string().trim().min(2).max(160),
  institution: z.string().trim().min(2).max(160),
  educationLevel: z.string().trim().max(100).default(''),
  specialty: z.string().trim().min(2).max(160),
  credentialReference: z.string().trim().max(500).default(''),
  statement: z.string().trim().min(30).max(2000),
});

export const verificationDecisionInputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(1500).default(''),
  contributionStatus: z.enum(['active_collaborator', 'specialist']).default('specialist'),
});

export const verificationDecisionResultSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['approved', 'rejected']),
  userId: z.string(),
});

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.string(),
  suspensionReason: optionalText,
  suspendedAt: timestamp,
  isMinor: z.boolean(),
  username: optionalText,
  displayName: optionalText,
  verificationStatus: z.string(),
  verifiedSpecialty: optionalText,
  roles: z.array(z.string()).default([]),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const adminRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  rank: z.number().int(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()).default([]),
});

export const auditEntrySchema = z.object({
  id: z.union([z.string(), z.number()]),
  adminId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestamp,
});

export const adminDashboardSchema = z.object({
  permissions: z.array(z.string()).default([]),
  reports: z.array(reportSchema).default([]),
  verificationRequests: z.array(verificationRequestSchema).default([]),
  researchReviewQueue: z.array(publicationSchema).default([]),
  newsContributorApplications: z.array(newsContributorSchema).default([]),
  newsEditorialQueue: z.array(newsArticleSchema).default([]),
  users: z.array(adminUserSchema).default([]),
  roles: z.array(adminRoleSchema).default([]),
  audit: z.array(auditEntrySchema).default([]),
});

export const userStatusInputSchema = z.object({
  status: z.enum(['active', 'suspended']),
  reason: z.string().trim().max(1000).default(''),
});

export const roleMutationInputSchema = z.object({ roleId: z.string().trim().min(1).max(80) });
export const adminMutationResultSchema = z.object({ ok: z.boolean() });
export const reportDecisionInputSchema = z.object({
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
  note: z.string().trim().max(1500).default(''),
});

export type VerificationRequest = z.infer<typeof verificationRequestSchema>;
export type SubmitVerificationInput = z.infer<typeof submitVerificationInputSchema>;
export type VerificationDecisionInput = z.infer<typeof verificationDecisionInputSchema>;
export type VerificationDecisionResult = z.infer<typeof verificationDecisionResultSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
export type UserStatusInput = z.infer<typeof userStatusInputSchema>;
export type RoleMutationInput = z.infer<typeof roleMutationInputSchema>;
export type ReportDecisionInput = z.infer<typeof reportDecisionInputSchema>;

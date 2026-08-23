import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const safetyControlKindSchema = z.enum(['block', 'mute']);

export const profileSafetyStateSchema = z.object({
  blocked: z.boolean().default(false),
  muted: z.boolean().default(false),
  blockedByTarget: z.boolean().default(false),
});

export const safetyControlResultSchema = z.object({
  targetUserId: z.string(),
  kind: safetyControlKindSchema,
  enabled: z.boolean(),
});

export const reportCategorySchema = z.enum([
  'odio',
  'racismo',
  'xenofobia',
  'sexismo',
  'machismo',
  'assedio',
  'bullying',
  'conteudo_sexual',
  'risco_menor',
  'dados_pessoais',
  'plagio',
  'spam',
  'golpe',
  'violencia',
  'outro',
]);

export const reportTargetTypeSchema = z.enum(['content', 'profile', 'community']);

export const createReportInputSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.string().trim().min(1).max(160),
  category: reportCategorySchema,
  description: z.string().trim().max(1500).default(''),
});

export const reportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  targetType: reportTargetTypeSchema,
  targetId: z.string(),
  category: reportCategorySchema,
  description: optionalText,
  status: z.string(),
  priority: z.string(),
  moderatorNote: optionalText,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const createReportResultSchema = z.object({ report: reportSchema });

export type SafetyControlKind = z.infer<typeof safetyControlKindSchema>;
export type ProfileSafetyState = z.infer<typeof profileSafetyStateSchema>;
export type SafetyControlResult = z.infer<typeof safetyControlResultSchema>;
export type ReportCategory = z.infer<typeof reportCategorySchema>;
export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;
export type CreateReportInput = z.infer<typeof createReportInputSchema>;
export type Report = z.infer<typeof reportSchema>;
export type CreateReportResult = z.infer<typeof createReportResultSchema>;

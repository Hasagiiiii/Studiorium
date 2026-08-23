import { z } from 'zod';
import { optionalText, timestamp } from '../common/fields.js';

export const profileSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  bio: optionalText,
  profileType: z.string().default('membro'),
  institution: optionalText,
  course: optionalText,
  educationLevel: optionalText,
  verificationStatus: z.string().default('unverified'),
  verifiedSpecialty: optionalText,
  contributionStatus: z.string().default('member'),
  hasAvatar: z.boolean().default(false),
  hasCover: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  verifiedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type Profile = z.infer<typeof profileSchema>;

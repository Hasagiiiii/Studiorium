import { z } from 'zod';

const nullableText = z.string().nullable();
const optionalText = z.string().default('');
const timestamp = z.string().nullable();

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
  memberCount: z.number().default(0),
  joined: z.boolean().default(false),
  role: z.string().nullable().default(null),
  memberModerationStatus: z.string().nullable().default(null),
});

export const templateSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  docType: z.string(),
  style: z.string().default('Clássico'),
  description: optionalText,
  downloads: z.number().default(0),
  featured: z.boolean().default(false),
  sections: z.array(z.string()).default([]),
});

export const publicationSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  abstract: optionalText,
  content: optionalText,
  area: z.string().default('Geral'),
  level: z.string().default('Não informado'),
  keywords: z.array(z.string()).default([]),
  license: optionalText,
  status: z.string(),
  views: z.number().default(0),
  downloads: z.number().default(0),
  boosts: z.number().default(0),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  publishedAt: timestamp,
  updatedAt: timestamp,
  coverName: nullableText.default(null),
  coverMime: nullableText.default(null),
});

export const discussionSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  title: z.string(),
  body: optionalText,
  category: z.string().default('Geral'),
  status: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const techResourceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: optionalText,
  hub: z.string().default('Tecnologia'),
  category: z.string().default('Tutorial'),
  tags: z.array(z.string()).default([]),
  status: z.string(),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const codeProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: optionalText,
  visibility: z.string().default('private'),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export const projectSchema = z.object({
  id: z.string(),
  ownerId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string(),
  type: z.string().default('Projeto'),
  visibility: z.string().default('private'),
  sections: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: optionalText,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export const newsArticleSchema = z.object({
  id: z.string(),
  contributorId: z.string().nullable().default(null),
  authorName: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: optionalText,
  body: optionalText,
  category: z.string().default('Atualizações'),
  status: z.string(),
  featured: z.boolean().default(false),
  hypes: z.number().default(0),
  certifiedBy: z.string().nullable().default(null),
  certifiedAt: timestamp,
  publishedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const customTemplateSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: optionalText,
  sourceType: z.string().default('editor'),
  status: z.string(),
  featured: z.boolean().default(false),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp,
});

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: optionalText,
  category: z.string().default('Geral'),
  coverTheme: z.string().default('umber'),
  featured: z.boolean().default(false),
  submittedBy: z.string().nullable().default(null),
  isbn: optionalText,
  coverUrl: optionalText,
  purchaseUrl: optionalText,
  purchaseLabel: optionalText,
  ratingAverage: z.number().default(0),
  reviewCount: z.number().default(0),
  recommendationCount: z.number().default(0),
  createdAt: timestamp,
});

export const bookReviewSchema = z.object({
  bookId: z.string(),
  userId: z.string(),
  reviewerName: z.string(),
  rating: z.number().min(1).max(5),
  review: optionalText,
  recommend: z.boolean().default(true),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export type Profile = z.infer<typeof profileSchema>;
export type Community = z.infer<typeof communitySchema>;
export type Template = z.infer<typeof templateSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type Discussion = z.infer<typeof discussionSchema>;
export type TechResource = z.infer<typeof techResourceSchema>;
export type CodeProject = z.infer<typeof codeProjectSchema>;
export type Project = z.infer<typeof projectSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type CustomTemplate = z.infer<typeof customTemplateSchema>;
export type Book = z.infer<typeof bookSchema>;
export type BookReview = z.infer<typeof bookReviewSchema>;

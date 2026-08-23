import { z } from 'zod';
import { discussionSchema } from '../discussions/schema.js';
import { newsArticleSchema } from '../news/schema.js';
import { projectSchema } from '../projects/schema.js';
import { publicationSchema } from '../research/schema.js';
import { techResourceSchema } from '../tech/schema.js';

export const followSummarySchema = z.object({
  followerCount: z.number().int().nonnegative().default(0),
  followingCount: z.number().int().nonnegative().default(0),
  isFollowing: z.boolean().default(false),
  canFollow: z.boolean().default(false),
});

export const socialGraphSchema = z.object({
  followingIds: z.array(z.string()).default([]),
});

const feedBase = z.object({ at: z.string().nullable().default(null) });

export const feedEntrySchema = z.discriminatedUnion('type', [
  feedBase.extend({ type: z.literal('publication'), item: publicationSchema }),
  feedBase.extend({ type: z.literal('discussion'), item: discussionSchema }),
  feedBase.extend({ type: z.literal('tech'), item: techResourceSchema }),
  feedBase.extend({ type: z.literal('news'), item: newsArticleSchema }),
  feedBase.extend({ type: z.literal('project'), item: projectSchema }),
]);

export const feedResponseSchema = z.object({
  feed: z.array(feedEntrySchema).default([]),
});

export type FollowSummary = z.infer<typeof followSummarySchema>;
export type SocialGraph = z.infer<typeof socialGraphSchema>;
export type FeedEntry = z.infer<typeof feedEntrySchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;

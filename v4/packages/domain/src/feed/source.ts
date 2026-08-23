import type { BootstrapPayload, FeedEntry } from '@lorion/contracts';

export type FeedSources = Pick<
  BootstrapPayload,
  'publications' | 'discussions' | 'news' | 'projects'
>;

export function buildFeedFromSources(data: FeedSources): FeedEntry[] {
  return [
    ...data.publications.map((item) => ({
      type: 'publication' as const,
      item,
      at: item.publishedAt || item.createdAt,
    })),
    ...data.discussions.map((item) => ({
      type: 'discussion' as const,
      item,
      at: item.createdAt,
    })),
    ...data.news.map((item) => ({
      type: 'news' as const,
      item,
      at: item.publishedAt || item.createdAt,
    })),
    ...data.projects
      .filter((item) => item.visibility === 'public')
      .map((item) => ({
        type: 'project' as const,
        item,
        at: item.updatedAt || item.createdAt,
      })),
  ];
}

export function buildPublicFeed(data: BootstrapPayload): FeedEntry[] {
  return buildFeedFromSources(data);
}

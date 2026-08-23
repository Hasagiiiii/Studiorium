import type { BootstrapPayload, FeedEntry } from '@lorion/contracts';

export function buildPublicFeed(data: BootstrapPayload): FeedEntry[] {
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
    ...data.communityProjects.map((item) => ({
      type: 'project' as const,
      item,
      at: item.updatedAt || item.createdAt,
    })),
  ];
}

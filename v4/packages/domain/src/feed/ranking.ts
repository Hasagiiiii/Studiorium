import type { FeedEntry, Profile } from '@lorion/contracts';

export type FeedMode = 'for-you' | 'following' | 'trending' | 'recent';

const FEED_MODES = new Set<FeedMode>(['for-you', 'following', 'trending', 'recent']);

export function normalizeFeedMode(value: string | null | undefined): FeedMode {
  return FEED_MODES.has(value as FeedMode) ? (value as FeedMode) : 'for-you';
}

function timestamp(entry: FeedEntry): number {
  if (!entry.at) return 0;
  const value = new Date(entry.at).getTime();
  return Number.isFinite(value) ? value : 0;
}

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ownerId(entry: FeedEntry): string | undefined {
  const item = entry.item as Record<string, unknown>;
  return [item.ownerId, item.authorId, item.contributorId].find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

function freshnessScore(entry: FeedEntry, now: number): number {
  const ageHours = Math.max(0, (now - timestamp(entry)) / 36e5);
  return 120 / (1 + ageHours / 24);
}

function activityScore(entry: FeedEntry): number {
  if (entry.type === 'publication') {
    return numeric(entry.item.boosts) * 8 + Math.log10(numeric(entry.item.views) + 1) * 16;
  }
  if (entry.type === 'discussion') return 18;
  if (entry.type === 'news') {
    return 14 + (entry.item.featured ? 48 : 0) + Math.log10(numeric(entry.item.likeCount) + 1) * 8;
  }
  if (entry.type === 'post') {
    return 12 + Math.log10(numeric(entry.item.likeCount) + 1) * 10;
  }
  return 10;
}

function verifiedScore(entry: FeedEntry, profiles: readonly Profile[]): number {
  const id = ownerId(entry);
  if (!id) return 0;
  const profile = profiles.find((item) => item.userId === id);
  return profile?.verificationStatus === 'verified' ? 14 : 0;
}

function blendedScore(entry: FeedEntry, profiles: readonly Profile[], now: number): number {
  return freshnessScore(entry, now) + activityScore(entry) + verifiedScore(entry, profiles);
}

export function sortFeed(
  entries: readonly FeedEntry[],
  mode: FeedMode,
  profiles: readonly Profile[] = [],
  now = Date.now(),
): FeedEntry[] {
  const feed = [...entries];

  if (mode === 'following' || mode === 'recent') {
    return feed.sort((a, b) => timestamp(b) - timestamp(a));
  }
  if (mode === 'trending') {
    return feed.sort(
      (a, b) =>
        activityScore(b) +
        freshnessScore(b, now) * 0.35 -
        (activityScore(a) + freshnessScore(a, now) * 0.35),
    );
  }
  return feed.sort((a, b) => blendedScore(b, profiles, now) - blendedScore(a, profiles, now));
}

import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export async function listFollowingIds(userId: string): Promise<string[]> {
  const result = await database()
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', userId);
  return queryList(result).map((row) => String((row as { followed_id: string }).followed_id));
}

export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  const result = await database()
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

async function exactCount(column: 'follower_id' | 'followed_id', userId: string): Promise<number> {
  const result = await database()
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId);
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

export async function followCounts(
  userId: string,
): Promise<{ followerCount: number; followingCount: number }> {
  const [followerCount, followingCount] = await Promise.all([
    exactCount('followed_id', userId),
    exactCount('follower_id', userId),
  ]);
  return { followerCount, followingCount };
}

export async function followUser(followerId: string, followedId: string): Promise<void> {
  const result = await database()
    .from('user_follows')
    .upsert(
      { follower_id: followerId, followed_id: followedId },
      { onConflict: 'follower_id,followed_id' },
    );
  if (result.error) throw new Error(result.error.message);
}

export async function unfollowUser(followerId: string, followedId: string): Promise<void> {
  const result = await database()
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId);
  if (result.error) throw new Error(result.error.message);
}

export async function createNotification(input: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
}): Promise<void> {
  const result = await database().from('notifications').insert({
    id: input.id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
  });
  if (result.error) throw new Error(result.error.message);
}

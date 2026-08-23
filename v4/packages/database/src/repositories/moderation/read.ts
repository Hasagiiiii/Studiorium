import { database } from '../../core/client.js';

export async function findUserIdByUsername(username: string): Promise<string | null> {
  const result = await database()
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data?.user_id || null;
}

export async function profileSafetyState(viewerId: string, targetUserId: string) {
  const result = await database()
    .from('user_safety_controls')
    .select('actor_id,target_user_id,kind')
    .or(
      `and(actor_id.eq.${viewerId},target_user_id.eq.${targetUserId}),and(actor_id.eq.${targetUserId},target_user_id.eq.${viewerId})`,
    );
  if (result.error) throw new Error(result.error.message);
  const rows = result.data || [];
  return {
    blocked: rows.some(
      (row) => row.actor_id === viewerId && row.target_user_id === targetUserId && row.kind === 'block',
    ),
    muted: rows.some(
      (row) => row.actor_id === viewerId && row.target_user_id === targetUserId && row.kind === 'mute',
    ),
    blockedByTarget: rows.some(
      (row) => row.actor_id === targetUserId && row.target_user_id === viewerId && row.kind === 'block',
    ),
  };
}

export async function excludedUserIdsForViewer(viewerId: string): Promise<string[]> {
  const result = await database()
    .from('user_safety_controls')
    .select('actor_id,target_user_id,kind')
    .or(`actor_id.eq.${viewerId},target_user_id.eq.${viewerId}`);
  if (result.error) throw new Error(result.error.message);
  const excluded = new Set<string>();
  for (const row of result.data || []) {
    if (row.actor_id === viewerId && (row.kind === 'block' || row.kind === 'mute')) {
      excluded.add(row.target_user_id);
    }
    if (row.target_user_id === viewerId && row.kind === 'block') excluded.add(row.actor_id);
  }
  return [...excluded];
}

export async function hasBlockBetween(userA: string, userB: string): Promise<boolean> {
  const state = await profileSafetyState(userA, userB);
  return state.blocked || state.blockedByTarget;
}

export async function reportTargetExists(
  targetType: 'content' | 'profile' | 'community',
  targetId: string,
): Promise<boolean> {
  if (targetType === 'content') {
    const result = await database()
      .from('content_items')
      .select('id')
      .eq('id', targetId)
      .eq('moderation_status', 'clear')
      .is('deleted_at', null)
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return Boolean(result.data);
  }
  if (targetType === 'profile') {
    const result = await database()
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetId)
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return Boolean(result.data);
  }
  const result = await database()
    .from('communities')
    .select('id')
    .eq('id', targetId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function findOpenDuplicateReport(
  reporterId: string,
  targetType: string,
  targetId: string,
): Promise<boolean> {
  const result = await database()
    .from('reports')
    .select('id')
    .eq('reporter_id', reporterId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .in('status', ['open', 'reviewing'])
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function listModerationReports() {
  const result = await database()
    .from('reports')
    .select('*')
    .in('status', ['open', 'reviewing'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(200);
  if (result.error) throw new Error(result.error.message);
  return result.data || [];
}

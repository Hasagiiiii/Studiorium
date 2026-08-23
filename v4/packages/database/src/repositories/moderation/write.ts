import type { CreateReportInput, SafetyControlKind } from '@lorion/contracts';
import { database } from '../../core/client.js';

export async function setSafetyControl(
  actorId: string,
  targetUserId: string,
  kind: SafetyControlKind,
  enabled: boolean,
): Promise<boolean> {
  const result = await database().rpc('set_user_safety_control', {
    p_actor_id: actorId,
    p_target_user_id: targetUserId,
    p_kind: kind,
    p_enabled: enabled,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}

export async function createModerationReport(
  id: string,
  reporterId: string,
  input: CreateReportInput,
) {
  const urgent = input.category === 'risco_menor' || input.category === 'conteudo_sexual';
  const result = await database()
    .from('reports')
    .insert({
      id,
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      category: input.category,
      description: input.description,
      status: 'open',
      priority: urgent ? 'urgent' : 'normal',
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function decideModerationReport(
  reportId: string,
  status: 'resolved' | 'dismissed' | 'reviewing',
  note: string,
) {
  const result = await database()
    .from('reports')
    .update({
      status,
      moderator_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .in('status', ['open', 'reviewing'])
    .select('*')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data || null;
}

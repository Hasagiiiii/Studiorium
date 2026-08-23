import { database } from '../../core/client.js';

export async function createVerificationRequest(input: {
  id: string;
  userId: string;
  profileType: string;
  course: string;
  institution: string;
  educationLevel: string;
  specialty: string;
  credentialReference: string;
  statement: string;
}) {
  const result = await database()
    .from('profile_verification_requests')
    .insert({
      id: input.id,
      user_id: input.userId,
      requested_level: 'specialist',
      profile_type: input.profileType,
      course: input.course,
      institution: input.institution,
      education_level: input.educationLevel,
      specialty: input.specialty,
      credential_reference: input.credentialReference,
      statement: input.statement,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (result.error) {
    if (result.error.code === '23505') {
      const error = new Error('Você já possui uma solicitação em análise.');
      Object.assign(error, { status: 409, code: 'VERIFICATION_PENDING' });
      throw error;
    }
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function setProfileVerificationPending(input: {
  userId: string;
  course: string;
  institution: string;
  educationLevel: string;
}): Promise<boolean> {
  const result = await database()
    .from('profiles')
    .update({
      course: input.course,
      institution: input.institution,
      education_level: input.educationLevel,
      verification_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', input.userId)
    .select('user_id')
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function deleteVerificationRequest(requestId: string): Promise<void> {
  const result = await database().from('profile_verification_requests').delete().eq('id', requestId);
  if (result.error) throw new Error(result.error.message);
}

const { db, fail } = require('../db');
const { requireUser, requireAdmin } = require('../auth');
const { readJson } = require('../http');
const { id, now } = require('../security');
const { audit } = require('../admin-audit');
const { createNotification } = require('./notifications');
const S = require('../serializers');

function clean(value, limit) {
  return String(value || '')
    .trim()
    .slice(0, limit);
}

async function submitVerification(req) {
  const user = await requireUser(req);
  if (user.is_minor) {
    throw Object.assign(new Error('Verificação profissional está disponível para maiores de 18 anos.'), {
      statusCode: 403,
    });
  }
  const body = await readJson(req);
  const course = clean(body.course, 160);
  const institution = clean(body.institution, 160);
  const educationLevel = clean(body.educationLevel, 100);
  const specialty = clean(body.specialty, 160);
  let credentialReference = clean(body.credentialReference, 500);
  if (credentialReference) {
    try {
      const referenceUrl = new URL(credentialReference);
      if (!['https:', 'http:'].includes(referenceUrl.protocol)) throw new Error('protocol');
      credentialReference = referenceUrl.toString();
    } catch {
      throw Object.assign(new Error('Informe um link de comprovação válido.'), { statusCode: 400 });
    }
  }
  const statement = clean(body.statement, 2000);
  if (!course || !institution || !specialty || statement.length < 30) {
    throw Object.assign(
      new Error('Informe curso, instituição, especialidade e uma descrição mais completa.'),
      { statusCode: 400 },
    );
  }
  const { data: profile, error: profileError } = await db()
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  fail(profileError);
  if (!profile) throw Object.assign(new Error('Perfil não encontrado.'), { statusCode: 404 });
  if (profile.verification_status === 'verified') {
    throw Object.assign(new Error('Este perfil já está verificado.'), { statusCode: 409 });
  }

  const row = {
    id: id('vrf'),
    user_id: user.id,
    profile_type: profile.profile_type,
    course,
    institution,
    education_level: educationLevel,
    specialty,
    credential_reference: credentialReference,
    statement,
    status: 'pending',
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await db()
    .from('profile_verification_requests')
    .insert(row)
    .select('*')
    .single();
  if (error?.code === '23505') {
    throw Object.assign(new Error('Você já possui uma solicitação em análise.'), { statusCode: 409 });
  }
  fail(error);
  const { error: updateError } = await db()
    .from('profiles')
    .update({
      course,
      institution,
      education_level: educationLevel,
      verification_status: 'pending',
    })
    .eq('user_id', user.id);
  if (updateError) {
    await db().from('profile_verification_requests').delete().eq('id', data.id);
    fail(updateError);
  }
  return {
    request: S.verificationRequest(data, profile),
    message: 'Solicitação enviada para análise da administração.',
  };
}

async function reviewVerification(req, requestId) {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : '';
  if (!status) throw Object.assign(new Error('Decisão inválida.'), { statusCode: 400 });
  const { data: request, error: requestError } = await db()
    .from('profile_verification_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'pending')
    .maybeSingle();
  fail(requestError);
  if (!request) throw Object.assign(new Error('Solicitação não encontrada.'), { statusCode: 404 });
  const note = clean(body.note, 1500);
  const contributionStatus = ['active_collaborator', 'specialist'].includes(body.contributionStatus)
    ? body.contributionStatus
    : 'specialist';
  const { data: userId, error } = await db().rpc('complete_profile_verification', {
    p_request_id: requestId,
    p_reviewer_id: admin.id,
    p_status: status,
    p_note: note,
    p_contribution_status: contributionStatus,
  });
  fail(error);
  if (!userId) throw Object.assign(new Error('Solicitação já analisada.'), { statusCode: 409 });
  await createNotification(userId, {
    type: 'verification',
    title: status === 'approved' ? 'Perfil verificado' : 'Verificação precisa de revisão',
    message:
      status === 'approved'
        ? `Seu perfil recebeu o selo de especialista em ${request.specialty}.`
        : note || 'A administração pediu que você revise as informações enviadas.',
    link: '/escrivaninha',
  });
  await audit(admin, 'profile.verification', 'profile', userId, {
    requestId,
    status,
    contributionStatus,
  });
  return { ok: true, status, userId };
}

module.exports = { submitVerification, reviewVerification };

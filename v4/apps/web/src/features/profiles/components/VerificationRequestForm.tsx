import { useState, type FormEvent } from 'react';
import type { Profile } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  profile: Profile;
  onSubmitted(): Promise<void> | void;
};

export function VerificationRequestForm({ profile, onSubmitted }: Props) {
  const { pushToast } = useToast();
  const [course, setCourse] = useState(profile.course);
  const [institution, setInstitution] = useState(profile.institution);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [specialty, setSpecialty] = useState(profile.verifiedSpecialty || '');
  const [credentialReference, setCredentialReference] = useState('');
  const [statement, setStatement] = useState('');
  const [saving, setSaving] = useState(false);

  if (profile.verificationStatus === 'verified') {
    return (
      <section className="verification-request-panel">
        <span className="eyebrow">Verificação profissional</span>
        <h2>Perfil verificado</h2>
        <p>
          Sua especialidade verificada é {profile.verifiedSpecialty || 'reconhecida pela administração'}.
        </p>
      </section>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <section className="verification-request-panel">
        <span className="eyebrow">Verificação profissional</span>
        <h2>Solicitação em análise</h2>
        <p>A administração ainda está analisando as informações enviadas.</p>
      </section>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await services.admin.submitVerification({
        course,
        institution,
        educationLevel,
        specialty,
        credentialReference,
        statement,
      });
      pushToast({ message: 'Solicitação enviada para análise.', tone: 'success' });
      await onSubmitted();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível enviar a solicitação.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="verification-request-panel" aria-labelledby="verification-request-title">
      <span className="eyebrow">Verificação profissional</span>
      <h2 id="verification-request-title">Solicitar análise</h2>
      <p>
        Declarar uma profissão no perfil não concede selo. A verificação exige análise administrativa separada.
      </p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Curso / formação
          <input required minLength={2} maxLength={160} value={course} onChange={(event) => setCourse(event.target.value)} />
        </label>
        <label>
          Instituição
          <input required minLength={2} maxLength={160} value={institution} onChange={(event) => setInstitution(event.target.value)} />
        </label>
        <label>
          Escolaridade
          <input maxLength={100} value={educationLevel} onChange={(event) => setEducationLevel(event.target.value)} />
        </label>
        <label>
          Especialidade que deseja verificar
          <input required minLength={2} maxLength={160} value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
        </label>
        <label>
          Link de comprovação
          <input
            type="url"
            maxLength={500}
            placeholder="https://…"
            value={credentialReference}
            onChange={(event) => setCredentialReference(event.target.value)}
          />
        </label>
        <label>
          Contexto para análise
          <textarea
            required
            minLength={30}
            maxLength={2000}
            rows={6}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Explique sua formação, atuação e por que a especialidade deve ser verificada."
          />
        </label>
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Enviando…' : 'Enviar para análise'}
        </button>
      </form>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import type { Profile, ProfileMediaKind, ProfileType } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

const PROFILE_TYPES: Array<{ value: ProfileType; label: string }> = [
  { value: 'estudante', label: 'Estudante' },
  { value: 'universitario', label: 'Universitário' },
  { value: 'professor', label: 'Professor' },
  { value: 'pesquisador', label: 'Pesquisador' },
  { value: 'designer', label: 'Designer' },
  { value: 'instituicao', label: 'Instituição' },
  { value: 'criador', label: 'Criador' },
  { value: 'jornalista', label: 'Jornalista' },
  { value: 'comunicador', label: 'Comunicador' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'autodidata', label: 'Autodidata' },
  { value: 'internauta', label: 'Internauta' },
];

type Props = {
  profile: Profile;
  onUpdated(profile: Profile): void;
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const value = String(reader.result || '');
      const comma = value.indexOf(',');
      if (comma < 0) reject(new Error('Imagem inválida.'));
      else resolve(value.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileEditor({ profile, onUpdated }: Props) {
  const { reload } = useAppState();
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [profileType, setProfileType] = useState<ProfileType>(
    PROFILE_TYPES.some((item) => item.value === profile.profileType)
      ? (profile.profileType as ProfileType)
      : 'estudante',
  );
  const [institution, setInstitution] = useState(profile.institution);
  const [course, setCourse] = useState(profile.course);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ProfileMediaKind | null>(null);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setProfileType(
      PROFILE_TYPES.some((item) => item.value === profile.profileType)
        ? (profile.profileType as ProfileType)
        : 'estudante',
    );
    setInstitution(profile.institution);
    setCourse(profile.course);
    setEducationLevel(profile.educationLevel);
    setIsPublic(profile.isPublic);
  }, [profile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const updated = await services.profiles.update({
        displayName,
        bio,
        profileType,
        institution,
        course,
        educationLevel,
        isPublic,
      });
      onUpdated(updated);
      await reload();
      pushToast({ message: 'Perfil atualizado.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível atualizar o perfil.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: ProfileMediaKind, file: File | null) {
    if (!file || uploading) return;
    if (file.size > 3 * 1024 * 1024) {
      pushToast({ message: 'A imagem precisa ter até 3 MB.', tone: 'error' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      pushToast({ message: 'Use uma imagem JPG, PNG ou WebP.', tone: 'error' });
      return;
    }
    setUploading(kind);
    try {
      const updated = await services.profiles.uploadMedia({
        kind,
        file: {
          name: file.name,
          mime: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          dataBase64: await fileToBase64(file),
        },
      });
      onUpdated(updated);
      pushToast({
        message: kind === 'avatar' ? 'Foto de perfil atualizada.' : 'Foto de capa atualizada.',
        tone: 'success',
      });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível enviar a imagem.',
        tone: 'error',
      });
    } finally {
      setUploading(null);
    }
  }

  async function remove(kind: ProfileMediaKind) {
    if (uploading) return;
    setUploading(kind);
    try {
      const updated = await services.profiles.removeMedia(kind);
      onUpdated(updated);
      pushToast({ message: 'Imagem removida.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível remover a imagem.',
        tone: 'error',
      });
    } finally {
      setUploading(null);
    }
  }

  const mediaVersion = encodeURIComponent(profile.updatedAt || 'current');

  return (
    <section className="profile-editor" aria-labelledby="profile-editor-title">
      <h2 id="profile-editor-title">Editar perfil</h2>

      <div className="profile-media-editor">
        <div>
          <strong>Foto de perfil</strong>
          {profile.hasAvatar ? (
            <img
              className="profile-avatar-preview"
              src={`${services.profiles.mediaUrl(profile.username, 'avatar')}?v=${mediaVersion}`}
              alt="Foto atual do perfil"
            />
          ) : null}
          <label className="button secondary">
            {uploading === 'avatar' ? 'Enviando…' : 'Escolher foto'}
            <input
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={Boolean(uploading)}
              onChange={(event) => void upload('avatar', event.target.files?.[0] || null)}
            />
          </label>
          {profile.hasAvatar ? (
            <button
              className="inline-action danger"
              type="button"
              disabled={Boolean(uploading)}
              onClick={() => void remove('avatar')}
            >
              Remover foto
            </button>
          ) : null}
        </div>

        <div>
          <strong>Foto de capa</strong>
          {profile.hasCover ? (
            <img
              className="profile-cover-preview"
              src={`${services.profiles.mediaUrl(profile.username, 'cover')}?v=${mediaVersion}`}
              alt="Capa atual do perfil"
            />
          ) : null}
          <label className="button secondary">
            {uploading === 'cover' ? 'Enviando…' : 'Escolher capa'}
            <input
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={Boolean(uploading)}
              onChange={(event) => void upload('cover', event.target.files?.[0] || null)}
            />
          </label>
          {profile.hasCover ? (
            <button
              className="inline-action danger"
              type="button"
              disabled={Boolean(uploading)}
              onClick={() => void remove('cover')}
            >
              Remover capa
            </button>
          ) : null}
        </div>
      </div>

      <form className="auth-form" onSubmit={save}>
        <label>
          Nome de exibição
          <input
            required
            minLength={2}
            maxLength={80}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          Bio
          <textarea maxLength={500} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label>
          Tipo de perfil declarado
          <select value={profileType} onChange={(event) => setProfileType(event.target.value as ProfileType)}>
            {PROFILE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Instituição
          <input maxLength={160} value={institution} onChange={(event) => setInstitution(event.target.value)} />
        </label>
        <label>
          Curso / formação
          <input maxLength={160} value={course} onChange={(event) => setCourse(event.target.value)} />
        </label>
        <label>
          Nível de escolaridade
          <input
            maxLength={100}
            value={educationLevel}
            onChange={(event) => setEducationLevel(event.target.value)}
          />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          Perfil público
        </label>
        <p className="create-launcher-note">
          Informações declaradas não concedem selo profissional. Verificação é analisada separadamente pela administração.
        </p>
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </form>
    </section>
  );
}

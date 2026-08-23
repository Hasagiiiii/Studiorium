import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FollowSummary, Profile, ProfileDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { ProfileContent } from '../components/ProfileContent.js';
import { ProfileEditor } from '../components/ProfileEditor.js';
import { ProfileSafetyActions } from '../components/ProfileSafetyActions.js';

type SocialState =
  | { status: 'loading'; value: FollowSummary | null; error: null }
  | { status: 'ready'; value: FollowSummary; error: null }
  | { status: 'error'; value: FollowSummary | null; error: string };

type DetailState =
  | { status: 'loading'; value: ProfileDetail | null; error: null }
  | { status: 'ready'; value: ProfileDetail; error: null }
  | { status: 'error'; value: ProfileDetail | null; error: string };

export function ProfilePage() {
  const { username = '' } = useParams();
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [detail, setDetail] = useState<DetailState>({ status: 'loading', value: null, error: null });
  const [social, setSocial] = useState<SocialState>({ status: 'loading', value: null, error: null });
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [updatingBookshelfPrivacy, setUpdatingBookshelfPrivacy] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!username) return;
    setDetail((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const value = await services.profiles.detail(username);
      setDetail({ status: 'ready', value, error: null });
    } catch (cause) {
      setDetail((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar o perfil.',
      }));
    }
  }, [username]);

  const loadSocial = useCallback(async () => {
    if (!username) return;
    setSocial((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const value = await services.social.profile(username);
      setSocial({ status: 'ready', value, error: null });
    } catch (cause) {
      setSocial((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar as conexões.',
      }));
    }
  }, [username]);

  useEffect(() => {
    void loadDetail();
    void loadSocial();
  }, [loadDetail, loadSocial]);

  const profile = detail.value?.profile || null;
  const isOwnProfile = detail.value?.isOwnProfile || false;

  function applyProfile(updated: Profile) {
    setDetail((current) =>
      current.value
        ? { status: 'ready', error: null, value: { ...current.value, profile: updated } }
        : current,
    );
  }

  async function toggleFollow() {
    if (!profile || !social.value?.canFollow || updatingFollow || detail.value?.viewerSafety.blocked) return;
    setUpdatingFollow(true);
    try {
      const result = social.value.isFollowing
        ? await services.social.unfollow(profile.username)
        : await services.social.follow(profile.username);
      setSocial({
        status: 'ready',
        error: null,
        value: {
          ...social.value,
          isFollowing: result.following,
          followerCount: result.followerCount,
          followingCount: result.followingCount,
        },
      });
      pushToast({
        message: result.following
          ? `Você está seguindo @${profile.username}.`
          : `Você deixou de seguir @${profile.username}.`,
        tone: 'success',
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível atualizar a conexão.';
      setSocial((current) => ({ status: 'error', value: current.value, error: message }));
      pushToast({ message, tone: 'error' });
    } finally {
      setUpdatingFollow(false);
    }
  }

  async function updateBookshelfPrivacy(bookshelfPublic: boolean) {
    if (!detail.value?.isOwnProfile || updatingBookshelfPrivacy) return;
    setUpdatingBookshelfPrivacy(true);
    try {
      const updatedProfile = await services.profiles.updateBookshelfPrivacy(bookshelfPublic);
      applyProfile(updatedProfile);
      pushToast({
        message: bookshelfPublic ? 'Sua estante agora é pública.' : 'Sua estante agora é privada.',
        tone: 'success',
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível alterar a privacidade da estante.';
      pushToast({ message, tone: 'error' });
    } finally {
      setUpdatingBookshelfPrivacy(false);
    }
  }

  if (detail.status === 'loading' && !detail.value) {
    return <FeaturePage eyebrow="Perfil" title="Carregando perfil…" description="Buscando dados públicos." />;
  }

  if (detail.status === 'error' && !detail.value) {
    return (
      <FeaturePage eyebrow="Perfil" title="Perfil indisponível" description={detail.error || 'Este perfil não está disponível para você.'}>
        <div className="inline-feedback" role="alert">
          <button className="button secondary" type="button" onClick={() => void loadDetail()}>
            Tentar novamente
          </button>
          <Link to="/explorar?tipo=Pessoa">Explorar pessoas</Link>
        </div>
      </FeaturePage>
    );
  }

  if (!profile || !detail.value) {
    return (
      <FeaturePage eyebrow="Perfil" title="Perfil não encontrado" description="Este usuário não existe ou o perfil não está disponível para você.">
        <Link to="/explorar?tipo=Pessoa">Explorar pessoas</Link>
      </FeaturePage>
    );
  }

  const mediaVersion = encodeURIComponent(profile.updatedAt || 'current');

  return (
    <FeaturePage
      eyebrow={profile.verificationStatus === 'verified' ? 'Perfil verificado' : 'Perfil'}
      title={profile.displayName}
      description={profile.bio || 'Membro da rede Lorion.'}
    >
      <section className="profile-overview">
        {profile.hasCover ? (
          <img
            className="profile-cover"
            src={`${services.profiles.mediaUrl(profile.username, 'cover')}?v=${mediaVersion}`}
            alt=""
          />
        ) : null}

        <div className="profile-header-row">
          {profile.hasAvatar ? (
            <img
              className="profile-avatar"
              src={`${services.profiles.mediaUrl(profile.username, 'avatar')}?v=${mediaVersion}`}
              alt={`Foto de ${profile.displayName}`}
            />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="profile-identity">
            <strong>@{profile.username}</strong>
            <span>{profile.profileType}</span>
            {profile.institution ? <span>{profile.institution}</span> : null}
            {profile.course ? <span>{profile.course}</span> : null}
            {profile.verifiedSpecialty ? <span>{profile.verifiedSpecialty}</span> : null}
            {!profile.isPublic && isOwnProfile ? <span>Perfil privado</span> : null}
          </div>
        </div>

        {isOwnProfile ? (
          <div className="form-actions">
            <Link className="button secondary" to="/conta/seguranca">
              Segurança da conta
            </Link>
          </div>
        ) : (
          <ProfileSafetyActions
            username={profile.username}
            userId={profile.userId}
            state={detail.value.viewerSafety}
            onChanged={async () => {
              await Promise.all([loadDetail(), loadSocial()]);
            }}
          />
        )}

        {social.value ? (
          <div className="profile-social">
            <span><strong>{social.value.followerCount}</strong> seguidores</span>
            <span><strong>{social.value.followingCount}</strong> seguindo</span>
            {!isOwnProfile && social.value.canFollow && !detail.value.viewerSafety.blocked ? (
              data?.user ? (
                <button className="button primary" type="button" disabled={updatingFollow} onClick={() => void toggleFollow()}>
                  {updatingFollow ? 'Atualizando…' : social.value.isFollowing ? 'Deixar de seguir' : 'Seguir'}
                </button>
              ) : (
                <Link className="button primary" to={`/entrar?retorno=${encodeURIComponent(`/perfil/${profile.username}`)}`}>
                  Entre para seguir
                </Link>
              )
            ) : null}
          </div>
        ) : null}

        {social.status === 'loading' && !social.value ? <p className="feed-status">Carregando conexões…</p> : null}
        {social.status === 'error' ? (
          <div className="inline-feedback" role="alert">
            <p className="inline-error">{social.error}</p>
            <button className="button secondary" type="button" onClick={() => void loadSocial()}>
              Tentar novamente
            </button>
          </div>
        ) : null}
        {detail.status === 'error' ? <p className="inline-error" role="alert">{detail.error}</p> : null}

        {isOwnProfile ? <ProfileEditor profile={profile} onUpdated={applyProfile} /> : null}

        <ProfileContent
          detail={detail.value}
          updatingBookshelfPrivacy={updatingBookshelfPrivacy}
          onBookshelfPrivacyChange={(value) => void updateBookshelfPrivacy(value)}
        />
      </section>
    </FeaturePage>
  );
}

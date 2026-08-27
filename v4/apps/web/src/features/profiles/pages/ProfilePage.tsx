import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FollowSummary, ProfileDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { ProfileContent } from '../components/ProfileContent.js';

type SocialState =
  | { status: 'loading'; value: FollowSummary | null; error: null }
  | { status: 'ready'; value: FollowSummary; error: null }
  | { status: 'error'; value: FollowSummary | null; error: string };

type DetailState =
  | { status: 'loading'; value: ProfileDetail | null; error: null }
  | { status: 'ready'; value: ProfileDetail; error: null }
  | { status: 'error'; value: ProfileDetail | null; error: string };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function ProfilePage() {
  const { username = '' } = useParams();
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [detail, setDetail] = useState<DetailState>({
    status: 'loading',
    value: null,
    error: null,
  });
  const [social, setSocial] = useState<SocialState>({
    status: 'loading',
    value: null,
    error: null,
  });
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
  const isOwnAdmin = Boolean(
    isOwnProfile && profile && data?.user?.id === profile.userId && data.user.role === 'admin',
  );

  async function toggleFollow() {
    if (!profile || !social.value?.canFollow || updatingFollow) return;
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
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível atualizar a conexão.';
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
      setDetail((current) =>
        current.value
          ? { status: 'ready', error: null, value: { ...current.value, profile: updatedProfile } }
          : current,
      );
      pushToast({
        message: bookshelfPublic ? 'Sua estante agora é pública.' : 'Sua estante agora é privada.',
        tone: 'success',
      });
    } catch (cause) {
      pushToast({
        message:
          cause instanceof Error
            ? cause.message
            : 'Não foi possível alterar a privacidade da estante.',
        tone: 'error',
      });
    } finally {
      setUpdatingBookshelfPrivacy(false);
    }
  }

  if (detail.status === 'loading' && !detail.value) {
    return (
      <FeaturePage
        eyebrow="Perfil"
        title="Carregando perfil…"
        description="Buscando dados públicos."
      />
    );
  }

  if (detail.status === 'error' && !detail.value) {
    return (
      <FeaturePage
        eyebrow="Perfil"
        title="Perfil indisponível"
        description={detail.error || 'Este perfil não está disponível para você.'}
      >
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
      <FeaturePage
        eyebrow="Perfil"
        title="Perfil não encontrado"
        description="Este usuário não existe ou o perfil não está disponível para você."
      >
        <Link to="/explorar?tipo=Pessoa">Explorar pessoas</Link>
      </FeaturePage>
    );
  }

  return (
    <main id="main-content" className="social-profile-page">
      <section className="social-profile-header">
        <div className="social-profile-cover" aria-hidden="true" />
        <div className="social-profile-body">
          <div className="social-profile-avatar" aria-label={`Avatar de ${profile.displayName}`}>
            {initials(profile.displayName) || '?'}
          </div>

          <div className="social-profile-topline">
            <div>
              <div className="social-profile-name-row">
                <h1>{profile.displayName}</h1>
                {profile.verificationStatus === 'verified' ? (
                  <span
                    className="verified-badge"
                    title="Perfil verificado"
                    aria-label="Perfil verificado"
                  >
                    ✓
                  </span>
                ) : null}
                {isOwnAdmin ? (
                  <span
                    className="verified-badge"
                    title="Conta administrativa"
                    aria-label="Conta administrativa"
                  >
                    ADM
                  </span>
                ) : null}
              </div>
              <p className="social-profile-handle">@{profile.username}</p>
            </div>

            <div className="social-profile-actions">
              {isOwnProfile ? (
                <Link className="button secondary" to="/conta/seguranca">
                  Configurações
                </Link>
              ) : social.value?.canFollow ? (
                data?.user ? (
                  <button
                    className={social.value.isFollowing ? 'button secondary' : 'button primary'}
                    type="button"
                    disabled={updatingFollow}
                    onClick={() => void toggleFollow()}
                  >
                    {updatingFollow
                      ? 'Atualizando…'
                      : social.value.isFollowing
                        ? 'Seguindo'
                        : 'Seguir'}
                  </button>
                ) : (
                  <Link
                    className="button primary"
                    to={`/entrar?retorno=${encodeURIComponent(`/perfil/${profile.username}`)}`}
                  >
                    Seguir
                  </Link>
                )
              ) : null}
            </div>
          </div>

          <div className="social-profile-stats" aria-label="Estatísticas do perfil">
            <span>
              <strong>{detail.value.posts.length}</strong> publicações
            </span>
            <span>
              <strong>{social.value?.followerCount ?? '—'}</strong> seguidores
            </span>
            <span>
              <strong>{social.value?.followingCount ?? '—'}</strong> seguindo
            </span>
          </div>

          <div className="social-profile-bio">
            {profile.bio ? <p>{profile.bio}</p> : <p>Membro da rede Lorion.</p>}
            <div className="social-profile-meta">
              <span>{isOwnAdmin ? 'Administrador' : profile.profileType}</span>
              {profile.institution ? <span>{profile.institution}</span> : null}
              {profile.course ? <span>{profile.course}</span> : null}
              {profile.verifiedSpecialty ? <span>{profile.verifiedSpecialty}</span> : null}
              {!profile.isPublic && isOwnProfile ? <span>Perfil privado</span> : null}
            </div>
          </div>

          {social.status === 'error' ? (
            <div className="inline-feedback" role="alert">
              <p className="inline-error">{social.error}</p>
              <button className="button secondary" type="button" onClick={() => void loadSocial()}>
                Tentar novamente
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <ProfileContent
        detail={detail.value}
        updatingBookshelfPrivacy={updatingBookshelfPrivacy}
        onBookshelfPrivacyChange={(value) => void updateBookshelfPrivacy(value)}
      />
    </main>
  );
}

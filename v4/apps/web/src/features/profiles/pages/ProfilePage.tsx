import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FollowSummary } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

type SocialState =
  | { status: 'idle'; value: null; error: null }
  | { status: 'loading'; value: null; error: null }
  | { status: 'ready'; value: FollowSummary; error: null }
  | { status: 'error'; value: null; error: string };

export function ProfilePage() {
  const { username = '' } = useParams();
  const { data } = useAppState();
  const profile = data?.profiles.find((item) => item.username === username);
  const isOwnProfile = Boolean(data?.user?.username && data.user.username === username);
  const [social, setSocial] = useState<SocialState>({ status: 'idle', value: null, error: null });

  useEffect(() => {
    let active = true;
    if (!profile) return;
    setSocial({ status: 'loading', value: null, error: null });
    void services.social
      .profile(profile.username)
      .then((value) => {
        if (active) setSocial({ status: 'ready', value, error: null });
      })
      .catch((cause) => {
        if (!active) return;
        setSocial({
          status: 'error',
          value: null,
          error: cause instanceof Error ? cause.message : 'Não foi possível carregar as conexões.',
        });
      });
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) {
    return (
      <FeaturePage
        eyebrow="Perfil"
        title="Perfil não encontrado"
        description="Este usuário não existe ou o perfil não está disponível publicamente."
      >
        <Link to="/explorar?tipo=Pessoa">Explorar pessoas</Link>
      </FeaturePage>
    );
  }

  const profileUsername = profile.username;

  async function toggleFollow() {
    if (social.status !== 'ready' || !social.value.canFollow) return;
    try {
      const result = social.value.isFollowing
        ? await services.social.unfollow(profileUsername)
        : await services.social.follow(profileUsername);
      setSocial({
        status: 'ready',
        error: null,
        value: {
          ...social.value,
          isFollowing: result.following,
          followerCount: result.followerCount,
        },
      });
    } catch (cause) {
      setSocial({
        status: 'error',
        value: null,
        error: cause instanceof Error ? cause.message : 'Não foi possível atualizar a conexão.',
      });
    }
  }

  return (
    <FeaturePage
      eyebrow={profile.verificationStatus === 'verified' ? 'Perfil verificado' : 'Perfil'}
      title={profile.displayName}
      description={profile.bio || 'Membro da rede Lorion.'}
    >
      <section className="profile-overview">
        <div className="profile-identity">
          <strong>@{profile.username}</strong>
          <span>{profile.profileType}</span>
          {profile.institution ? <span>{profile.institution}</span> : null}
          {profile.course ? <span>{profile.course}</span> : null}
          {profile.verifiedSpecialty ? <span>{profile.verifiedSpecialty}</span> : null}
        </div>

        {social.status === 'ready' ? (
          <div className="profile-social">
            <span>
              <strong>{social.value.followerCount}</strong> seguidores
            </span>
            <span>
              <strong>{social.value.followingCount}</strong> seguindo
            </span>
            {!isOwnProfile && social.value.canFollow ? (
              data?.user ? (
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void toggleFollow()}
                >
                  {social.value.isFollowing ? 'Deixar de seguir' : 'Seguir'}
                </button>
              ) : (
                <Link className="button primary" to="/entrar">
                  Entre para seguir
                </Link>
              )
            ) : null}
          </div>
        ) : social.status === 'error' ? (
          <p className="inline-error">{social.error}</p>
        ) : null}
      </section>
    </FeaturePage>
  );
}

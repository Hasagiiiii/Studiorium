import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FollowSummary, SocialPost } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { FeedCard } from '../../social/components/FeedCard.js';

type SocialState =
  | { status: 'loading'; value: FollowSummary | null; error: null }
  | { status: 'ready'; value: FollowSummary; error: null }
  | { status: 'error'; value: FollowSummary | null; error: string };

type PostsState =
  | { status: 'loading'; value: SocialPost[]; error: null }
  | { status: 'ready'; value: SocialPost[]; error: null }
  | { status: 'error'; value: SocialPost[]; error: string };

export function ProfilePage() {
  const { username = '' } = useParams();
  const { data } = useAppState();
  const { pushToast } = useToast();
  const profile = data?.profiles.find((item) => item.username === username);
  const isOwnProfile = Boolean(data?.user?.username && data.user.username === username);
  const [social, setSocial] = useState<SocialState>({
    status: 'loading',
    value: null,
    error: null,
  });
  const [posts, setPosts] = useState<PostsState>({ status: 'loading', value: [], error: null });
  const [updating, setUpdating] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const loadSocial = useCallback(async () => {
    if (!profile) return;
    setSocial((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const value = await services.social.profile(profile.username);
      setSocial({ status: 'ready', value, error: null });
    } catch (cause) {
      setSocial((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar as conexões.',
      }));
    }
  }, [profile]);

  const loadPosts = useCallback(async () => {
    if (!profile) return;
    setPosts((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const result = await services.social.profilePosts(profile.username);
      setPosts({ status: 'ready', value: result.posts, error: null });
    } catch (cause) {
      setPosts((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar as publicações.',
      }));
    }
  }, [profile]);

  useEffect(() => {
    void loadSocial();
  }, [loadSocial]);
  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);
  useEffect(() => {
    const refresh = () => {
      void loadPosts();
    };
    window.addEventListener('lorion:profile-posts-refresh', refresh);
    return () => window.removeEventListener('lorion:profile-posts-refresh', refresh);
  }, [loadPosts]);

  if (!profile) {
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

  const profileUsername = profile.username;

  async function toggleFollow() {
    if (!social.value?.canFollow || updating) return;
    setUpdating(true);
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
          followingCount: result.followingCount,
        },
      });
      pushToast({
        message: result.following
          ? `Você está seguindo @${profileUsername}.`
          : `Você deixou de seguir @${profileUsername}.`,
        tone: 'success',
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível atualizar a conexão.';
      setSocial((current) => ({ status: 'error', value: current.value, error: message }));
      pushToast({ message, tone: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  async function deletePost(postId: string) {
    if (!isOwnProfile || deletingPostId) return;
    setDeletingPostId(postId);
    try {
      await services.social.deletePost(postId);
      setPosts((current) => ({
        status: 'ready',
        error: null,
        value: current.value.filter((post) => post.id !== postId),
      }));
      window.dispatchEvent(new Event('lorion:feed-refresh'));
      pushToast({ message: 'Publicação removida com segurança.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível remover a publicação.',
        tone: 'error',
      });
    } finally {
      setDeletingPostId(null);
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

        {social.value ? (
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
                  disabled={updating}
                  onClick={() => void toggleFollow()}
                >
                  {updating
                    ? 'Atualizando…'
                    : social.value.isFollowing
                      ? 'Deixar de seguir'
                      : 'Seguir'}
                </button>
              ) : (
                <Link className="button primary" to="/entrar">
                  Entre para seguir
                </Link>
              )
            ) : null}
          </div>
        ) : null}

        {social.status === 'loading' && !social.value ? (
          <p className="feed-status">Carregando conexões…</p>
        ) : null}
        {social.status === 'error' ? (
          <div className="inline-feedback" role="alert">
            <p className="inline-error">{social.error}</p>
            <button className="button secondary" type="button" onClick={() => void loadSocial()}>
              Tentar novamente
            </button>
          </div>
        ) : null}
      </section>

      <section className="profile-posts" aria-labelledby="profile-posts-title">
        <header className="section-heading">
          <div>
            <span className="eyebrow">Perfil</span>
            <h2 id="profile-posts-title">Publicações</h2>
          </div>
        </header>
        {posts.status === 'loading' && posts.value.length === 0 ? (
          <p className="feed-status">Carregando publicações…</p>
        ) : null}
        {posts.status === 'error' ? (
          <div className="inline-feedback" role="alert">
            <p className="inline-error">{posts.error}</p>
            <button className="button secondary" type="button" onClick={() => void loadPosts()}>
              Tentar novamente
            </button>
          </div>
        ) : null}
        {posts.status !== 'loading' && posts.value.length === 0 ? (
          <p className="feed-status">Nenhuma publicação ainda.</p>
        ) : null}
        <div className="profile-post-list">
          {posts.value.map((post, index) => (
            <div className="profile-post-item" key={post.id}>
              <FeedCard entry={{ type: 'post', at: post.createdAt, item: post }} index={index} />
              {isOwnProfile ? (
                <button
                  type="button"
                  className="button secondary post-delete-button"
                  disabled={deletingPostId === post.id}
                  onClick={() => void deletePost(post.id)}
                >
                  {deletingPostId === post.id ? 'Removendo…' : 'Remover publicação'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}

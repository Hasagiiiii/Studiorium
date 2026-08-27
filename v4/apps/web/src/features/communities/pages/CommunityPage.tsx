import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CommunityMembershipRequest, CommunityMembershipResult } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { CommunityHub } from '../components/CommunityHub.js';

export function CommunityPage() {
  const { slug = '' } = useParams();
  const { data } = useAppState();
  const { pushToast } = useToast();
  const community = data?.communities.find((item) => item.slug === slug);
  const [membership, setMembership] = useState<CommunityMembershipResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [membershipError, setMembershipError] = useState('');
  const [requests, setRequests] = useState<CommunityMembershipRequest[]>([]);
  const [requestsStatus, setRequestsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [requestsError, setRequestsError] = useState('');
  const [decidingUserId, setDecidingUserId] = useState('');

  useEffect(() => {
    const canModerate =
      community?.joined && (community.role === 'leader' || community.role === 'moderator');
    if (!canModerate) {
      setRequests([]);
      setRequestsStatus('idle');
      setRequestsError('');
      return;
    }

    let active = true;
    setRequestsStatus('loading');
    setRequestsError('');
    void services.communities
      .requests(community.slug)
      .then((value) => {
        if (!active) return;
        setRequests(value);
        setRequestsStatus('ready');
      })
      .catch((cause) => {
        if (!active) return;
        setRequestsStatus('error');
        setRequestsError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar as solicitações.',
        );
      });

    return () => {
      active = false;
    };
  }, [community?.joined, community?.role, community?.slug]);

  if (!community) {
    return (
      <FeaturePage
        eyebrow="Comunidades"
        title="Comunidade não encontrada"
        description="Ela pode ser privada, ter sido removida ou o endereço pode estar incorreto."
      >
        <Link to="/comunidades">Voltar às comunidades</Link>
      </FeaturePage>
    );
  }

  const currentCommunity = community;
  const joined = membership?.joined ?? currentCommunity.joined;
  const membershipStatus = membership?.membershipStatus ?? currentCommunity.membershipStatus;
  const role = membership?.role ?? currentCommunity.role;
  const moderationStatus =
    membership?.memberModerationStatus ?? currentCommunity.memberModerationStatus;
  const memberCount = membership?.memberCount ?? currentCommunity.memberCount;
  const canModerate = joined && (role === 'leader' || role === 'moderator');
  const canAccessHub = currentCommunity.visibility === 'public' || joined;
  const visibilityLabel =
    currentCommunity.visibility === 'public'
      ? 'Pública'
      : currentCommunity.visibility === 'restricted'
        ? 'Entrada por aprovação'
        : 'Privada';

  async function updateMembership(action: 'join' | 'leave' | 'request') {
    if (updating || !data?.user) return;
    setUpdating(true);
    setMembershipError('');
    try {
      const result =
        action === 'leave'
          ? await services.communities.leave(currentCommunity.slug)
          : action === 'request'
            ? await services.communities.requestJoin(currentCommunity.slug)
            : await services.communities.join(currentCommunity.slug);
      setMembership(result);
      pushToast({
        message:
          action === 'request'
            ? `Solicitação enviada para ${currentCommunity.name}.`
            : result.joined
              ? `Você entrou em ${currentCommunity.name}.`
              : `Você saiu de ${currentCommunity.name}.`,
        tone: 'success',
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível atualizar sua participação.';
      setMembershipError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  async function decideRequest(userId: string, approve: boolean) {
    if (decidingUserId) return;
    setDecidingUserId(userId);
    setRequestsError('');
    try {
      await services.communities.decideRequest(currentCommunity.slug, userId, approve);
      setRequests((current) => current.filter((request) => request.userId !== userId));
      pushToast({
        message: approve ? 'Solicitação aprovada.' : 'Solicitação rejeitada.',
        tone: 'success',
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível decidir a solicitação.';
      setRequestsError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setDecidingUserId('');
    }
  }

  return (
    <div className="community-detail-page">
      <section className="community-hero" aria-labelledby="community-title">
        <div className="community-cover" aria-hidden="true" />
        <div className="community-identity-row">
          <div className="community-avatar" aria-hidden="true">
            {currentCommunity.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="community-identity-copy">
            <div className="community-title-line">
              <h1 id="community-title">{currentCommunity.name}</h1>
              {currentCommunity.official ? (
                <span className="community-official">Oficial</span>
              ) : null}
            </div>
            <p>{currentCommunity.description || 'Espaço de colaboração no Lorion.'}</p>
            <div className="community-inline-meta">
              <span>{currentCommunity.area}</span>
              <span>{memberCount} membros</span>
              <span>{visibilityLabel}</span>
              {joined && role ? <span>Você é {role}</span> : null}
            </div>
          </div>
          <div className="community-primary-action">
            {moderationStatus === 'removed' ? (
              <span className="community-membership-state danger">Participação removida</span>
            ) : joined ? (
              role === 'leader' ? (
                <span className="community-membership-state">Você lidera esta comunidade</span>
              ) : (
                <button
                  className="button secondary"
                  type="button"
                  disabled={updating}
                  onClick={() => void updateMembership('leave')}
                >
                  {updating ? 'Atualizando…' : 'Participando'}
                </button>
              )
            ) : !data?.user ? (
              <Link
                className="button primary"
                to={`/entrar?retorno=${encodeURIComponent(`/comunidades/${currentCommunity.slug}`)}`}
              >
                Entrar para participar
              </Link>
            ) : currentCommunity.visibility === 'public' ? (
              <button
                className="button primary"
                type="button"
                disabled={updating}
                onClick={() => void updateMembership('join')}
              >
                {updating ? 'Entrando…' : 'Participar'}
              </button>
            ) : currentCommunity.visibility === 'restricted' ? (
              membershipStatus === 'pending' ? (
                <span className="community-membership-state">Solicitação enviada</span>
              ) : (
                <button
                  className="button primary"
                  type="button"
                  disabled={updating}
                  onClick={() => void updateMembership('request')}
                >
                  {updating
                    ? 'Enviando…'
                    : membershipStatus === 'rejected'
                      ? 'Solicitar novamente'
                      : 'Solicitar entrada'}
                </button>
              )
            ) : (
              <span className="community-membership-state">Somente por convite</span>
            )}
          </div>
        </div>

        <nav className="community-local-nav" aria-label="Navegação da comunidade">
          <a href="#conversas">Conversas</a>
          <a href="#sobre">Sobre</a>
          {currentCommunity.rules.length ? <a href="#regras">Regras</a> : null}
          {canModerate ? (
            <a href="#moderacao">Moderação{requests.length ? ` (${requests.length})` : ''}</a>
          ) : null}
        </nav>
      </section>

      {membershipError ? (
        <p className="inline-error community-page-error" role="alert">
          {membershipError}
        </p>
      ) : null}

      <div className="community-interior-layout">
        <main id="conversas" className="community-interior-main">
          <CommunityHub slug={currentCommunity.slug} canAccess={canAccessHub} />
        </main>

        <aside className="community-interior-sidebar">
          <section id="sobre" className="community-info-panel">
            <span className="eyebrow">Sobre</span>
            <h2>{currentCommunity.name}</h2>
            <p>
              {currentCommunity.description ||
                'Comunidade criada para reunir pessoas, ideias e conteúdo em torno deste tema.'}
            </p>
            <dl className="community-facts">
              <div>
                <dt>Área</dt>
                <dd>{currentCommunity.area}</dd>
              </div>
              <div>
                <dt>Membros</dt>
                <dd>{memberCount}</dd>
              </div>
              <div>
                <dt>Acesso</dt>
                <dd>{visibilityLabel}</dd>
              </div>
            </dl>
          </section>

          {currentCommunity.rules.length ? (
            <section id="regras" className="community-info-panel">
              <span className="eyebrow">Convivência</span>
              <h2>Regras</h2>
              <ol className="community-rules-list">
                {currentCommunity.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {canModerate ? (
            <section id="moderacao" className="community-info-panel community-moderation-panel">
              <span className="eyebrow">Moderação</span>
              <h2>Solicitações</h2>
              {requestsStatus === 'loading' ? <p>Carregando…</p> : null}
              {requestsStatus === 'ready' && !requests.length ? (
                <p>Nenhuma solicitação pendente.</p>
              ) : null}
              {requests.length ? (
                <ul className="community-request-list">
                  {requests.map((request) => (
                    <li key={request.userId}>
                      <div>
                        {request.username ? (
                          <Link to={`/perfil/${encodeURIComponent(request.username)}`}>
                            {request.displayName}
                          </Link>
                        ) : (
                          <strong>{request.displayName}</strong>
                        )}
                        {request.username ? <small>@{request.username}</small> : null}
                      </div>
                      <div className="community-request-actions">
                        <button
                          type="button"
                          disabled={Boolean(decidingUserId)}
                          onClick={() => void decideRequest(request.userId, true)}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(decidingUserId)}
                          onClick={() => void decideRequest(request.userId, false)}
                        >
                          Recusar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {requestsStatus === 'error' || requestsError ? (
                <p className="inline-error" role="alert">
                  {requestsError || 'Não foi possível carregar as solicitações.'}
                </p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

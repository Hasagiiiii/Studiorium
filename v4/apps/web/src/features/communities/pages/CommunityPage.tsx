import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CommunityMembershipRequest, CommunityMembershipResult } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

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
    <FeaturePage
      eyebrow={currentCommunity.area}
      title={currentCommunity.name}
      description={currentCommunity.description || 'Espaço de colaboração no Lorion.'}
    >
      <section className="community-overview">
        <div className="community-stats">
          <span>
            <strong>{memberCount}</strong> membros
          </span>
          <span>
            {currentCommunity.visibility === 'public'
              ? 'Pública'
              : currentCommunity.visibility === 'restricted'
                ? 'Entrada por aprovação'
                : 'Privada'}
          </span>
          {currentCommunity.official ? <span>Comunidade oficial</span> : null}
          {joined && role ? <span>Seu papel: {role}</span> : null}
        </div>

        <div className="community-membership-actions">
          {moderationStatus === 'removed' ? (
            <p className="inline-error" role="alert">
              Sua participação nesta comunidade foi removida pela moderação.
            </p>
          ) : joined ? (
            role === 'leader' ? (
              <p>Você lidera esta comunidade. Transfira a liderança antes de sair.</p>
            ) : (
              <button
                className="button secondary"
                type="button"
                disabled={updating}
                onClick={() => void updateMembership('leave')}
              >
                {updating ? 'Atualizando…' : 'Sair da comunidade'}
              </button>
            )
          ) : !data?.user ? (
            <Link
              className="button primary"
              to={`/entrar?retorno=${encodeURIComponent(`/comunidades/${currentCommunity.slug}`)}`}
            >
              Entre para participar
            </Link>
          ) : currentCommunity.visibility === 'public' ? (
            <button
              className="button primary"
              type="button"
              disabled={updating}
              onClick={() => void updateMembership('join')}
            >
              {updating ? 'Entrando…' : 'Entrar na comunidade'}
            </button>
          ) : currentCommunity.visibility === 'restricted' ? (
            membershipStatus === 'pending' ? (
              <p role="status">Solicitação de entrada enviada. Aguarde a moderação.</p>
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
            <p>Esta comunidade é privada e não aceita solicitações públicas.</p>
          )}

          {membershipError ? (
            <p className="inline-error" role="alert">
              {membershipError}
            </p>
          ) : null}
        </div>

        {canModerate ? (
          <section className="community-membership-requests">
            <h2>Solicitações de entrada</h2>
            {requestsStatus === 'loading' ? <p>Carregando solicitações…</p> : null}
            {requestsStatus === 'ready' && !requests.length ? (
              <p>Não há solicitações pendentes.</p>
            ) : null}
            {requests.length ? (
              <ul>
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
                      {request.username ? <span> @{request.username}</span> : null}
                    </div>
                    <div>
                      <button
                        className="button primary"
                        type="button"
                        disabled={Boolean(decidingUserId)}
                        onClick={() => void decideRequest(request.userId, true)}
                      >
                        {decidingUserId === request.userId ? 'Atualizando…' : 'Aprovar'}
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        disabled={Boolean(decidingUserId)}
                        onClick={() => void decideRequest(request.userId, false)}
                      >
                        Rejeitar
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

        {currentCommunity.rules.length ? (
          <div className="community-rules">
            <h2>Diretrizes da comunidade</h2>
            <ul>
              {currentCommunity.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </FeaturePage>
  );
}

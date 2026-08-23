import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CommunityMembershipResult } from '@lorion/contracts';
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

  const joined = membership?.joined ?? community.joined;
  const role = membership?.role ?? community.role;
  const moderationStatus = membership?.memberModerationStatus ?? community.memberModerationStatus;
  const memberCount = membership?.memberCount ?? community.memberCount;

  async function toggleMembership() {
    if (updating || community.visibility !== 'public') return;
    if (!data?.user) return;

    setUpdating(true);
    setMembershipError('');
    try {
      const result = joined
        ? await services.communities.leave(community.slug)
        : await services.communities.join(community.slug);
      setMembership(result);
      pushToast({
        message: result.joined
          ? `Você entrou em ${community.name}.`
          : `Você saiu de ${community.name}.`,
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

  return (
    <FeaturePage
      eyebrow={community.area}
      title={community.name}
      description={community.description || 'Espaço de colaboração no Lorion.'}
    >
      <section className="community-overview">
        <div className="community-stats">
          <span>
            <strong>{memberCount}</strong> membros
          </span>
          <span>{community.visibility === 'public' ? 'Pública' : 'Acesso controlado'}</span>
          {community.official ? <span>Comunidade oficial</span> : null}
          {joined && role ? <span>Seu papel: {role}</span> : null}
        </div>

        <div className="community-membership-actions">
          {moderationStatus === 'removed' ? (
            <p className="inline-error" role="alert">
              Sua participação nesta comunidade foi removida pela moderação.
            </p>
          ) : community.visibility !== 'public' ? (
            <p>A entrada nesta comunidade depende de aprovação.</p>
          ) : data?.user ? (
            <button
              className={joined ? 'button secondary' : 'button primary'}
              type="button"
              disabled={updating}
              onClick={() => void toggleMembership()}
            >
              {updating ? 'Atualizando…' : joined ? 'Sair da comunidade' : 'Entrar na comunidade'}
            </button>
          ) : (
            <Link
              className="button primary"
              to={`/entrar?retorno=${encodeURIComponent(`/comunidades/${community.slug}`)}`}
            >
              Entre para participar
            </Link>
          )}

          {membershipError ? (
            <p className="inline-error" role="alert">
              {membershipError}
            </p>
          ) : null}
        </div>

        {community.rules.length ? (
          <div className="community-rules">
            <h2>Diretrizes da comunidade</h2>
            <ul>
              {community.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </FeaturePage>
  );
}

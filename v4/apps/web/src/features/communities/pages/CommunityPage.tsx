import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CommunityPage() {
  const { slug = '' } = useParams();
  const { data } = useAppState();
  const community = data?.communities.find((item) => item.slug === slug);

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

  return (
    <FeaturePage
      eyebrow={community.area}
      title={community.name}
      description={community.description || 'Espaço de colaboração no Lorion.'}
    >
      <section className="community-overview">
        <div className="community-stats">
          <span>
            <strong>{community.memberCount}</strong> membros
          </span>
          <span>{community.visibility === 'public' ? 'Pública' : 'Acesso controlado'}</span>
          {community.official ? <span>Comunidade oficial</span> : null}
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

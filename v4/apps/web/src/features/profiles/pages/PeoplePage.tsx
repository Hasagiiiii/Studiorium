import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function PeoplePage() {
  const { data } = useAppState();
  const profiles = data?.profiles ?? [];

  return (
    <FeaturePage
      eyebrow="Pessoas"
      title="Encontre quem estuda e cria"
      description="Perfis, especialidades e contribuições em uma rede orientada por conhecimento."
    >
      <section className="resource-grid">
        {profiles.map((profile) => (
          <article key={profile.userId} className="resource-card profile-card">
            <span className="eyebrow">{profile.profileType}</span>
            <h2><Link to={`/perfil/${encodeURIComponent(profile.username)}`}>{profile.displayName}</Link></h2>
            <p>{profile.bio || profile.verifiedSpecialty || 'Membro da comunidade Lorion.'}</p>
          </article>
        ))}
      </section>
    </FeaturePage>
  );
}

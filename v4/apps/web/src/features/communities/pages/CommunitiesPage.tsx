import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CommunitiesPage() {
  const { data } = useAppState();
  const communities = data?.communities ?? [];

  return (
    <FeaturePage
      eyebrow="Comunidades"
      title="Encontre seu espaço"
      description="Espaços de estudo, criação e colaboração organizados por interesse."
    >
      {communities.length ? (
        <section className="resource-grid">
          {communities.map((community) => (
            <article key={community.id} className="resource-card">
              <span className="eyebrow">{community.area}</span>
              <h2>
                <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>
                  {community.name}
                </Link>
              </h2>
              <p>{community.description}</p>
              <footer>{community.memberCount} membros</footer>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <p>Nenhuma comunidade está disponível para descoberta neste momento.</p>
        </section>
      )}
    </FeaturePage>
  );
}

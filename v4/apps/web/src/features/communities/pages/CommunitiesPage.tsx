import { Link } from 'react-router-dom';
import type { Community } from '@lorion/contracts';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CommunitiesPage() {
  const { data } = useAppState();
  const communities = data?.communities ?? [];
  const joined = communities.filter((community) => community.joined);
  const discover = communities.filter((community) => !community.joined);
  const trending = [...communities].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

  return (
    <FeaturePage
      eyebrow="Comunidades"
      title="Comunidades"
      description="Participe de discussões, acompanhe áreas de interesse e encontre pessoas estudando as mesmas coisas que você."
    >
      {communities.length ? (
        <div className="communities-layout">
          <main className="communities-main">
            {joined.length ? (
              <section className="community-discovery-section">
                <div className="community-section-heading">
                  <div>
                    <span className="eyebrow">Sua rede</span>
                    <h2>Suas comunidades</h2>
                  </div>
                </div>
                <div className="community-list">
                  {joined.map((community) => (
                    <CommunityRow key={community.id} community={community} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="community-discovery-section">
              <div className="community-section-heading">
                <div>
                  <span className="eyebrow">Descobrir</span>
                  <h2>
                    {joined.length ? 'Explore outras comunidades' : 'Encontre sua comunidade'}
                  </h2>
                </div>
              </div>
              <div className="community-list">
                {(discover.length ? discover : communities).map((community) => (
                  <CommunityRow key={community.id} community={community} />
                ))}
              </div>
            </section>
          </main>

          <aside className="communities-sidebar" aria-label="Comunidades em destaque">
            <section className="community-sidebar-card">
              <span className="eyebrow">Em alta</span>
              <h2>Comunidades populares</h2>
              <ol className="community-ranking">
                {trending.map((community, index) => (
                  <li key={community.id}>
                    <span className="community-rank">{index + 1}</span>
                    <div>
                      <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>
                        {community.name}
                      </Link>
                      <small>
                        {community.memberCount} membros · {community.area}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      ) : (
        <section className="empty-state">
          <h2>Nenhuma comunidade disponível.</h2>
          <p>Quando novos espaços forem publicados, eles aparecerão aqui.</p>
        </section>
      )}
    </FeaturePage>
  );
}

function CommunityRow({ community }: { community: Community }) {
  return (
    <article className="community-row">
      <Link
        className="community-row-avatar"
        to={`/comunidades/${encodeURIComponent(community.slug)}`}
        aria-label={community.name}
      >
        {community.name.slice(0, 1).toUpperCase()}
      </Link>
      <div className="community-row-copy">
        <div className="community-row-title">
          <h3>
            <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>{community.name}</Link>
          </h3>
          {community.official ? <span className="community-official">Oficial</span> : null}
        </div>
        <p>{community.description || 'Comunidade de colaboração e conhecimento no Lorion.'}</p>
        <div className="community-row-meta">
          <span>{community.area}</span>
          <span>{community.memberCount} membros</span>
          <span>
            {community.visibility === 'public'
              ? 'Pública'
              : community.visibility === 'restricted'
                ? 'Entrada por aprovação'
                : 'Privada'}
          </span>
        </div>
      </div>
      <Link className="community-open" to={`/comunidades/${encodeURIComponent(community.slug)}`}>
        {community.joined ? 'Abrir' : 'Conhecer'}
      </Link>
    </article>
  );
}

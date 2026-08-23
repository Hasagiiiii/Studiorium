import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CommunitiesPage() {
  const { data } = useAppState();
  const communities = data?.communities ?? [];
  const publicProjects = (data?.projects ?? []).filter((project) => project.visibility === 'public').slice(0, 12);

  return (
    <FeaturePage
      eyebrow="Comunidades"
      title="Encontre seu espaço"
      description="Espaços de estudo, criação e colaboração organizados por interesse."
    >
      {communities.length ? (
        <section className="resource-grid" aria-label="Comunidades disponíveis">
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

      {publicProjects.length ? (
        <section className="community-projects" aria-labelledby="community-projects-title">
          <header className="section-heading">
            <div>
              <span className="eyebrow">Projetos públicos</span>
              <h2 id="community-projects-title">Criações da comunidade Lorion</h2>
            </div>
            <Link to="/explorar?tipo=Projeto">Explorar todos</Link>
          </header>
          <div className="resource-grid">
            {publicProjects.map((project) => (
              <article key={project.id} className="resource-card">
                <span className="eyebrow">{project.type}</span>
                <h3>
                  <Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link>
                </h3>
                <p>{project.notes || 'Projeto público compartilhado com a comunidade.'}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </FeaturePage>
  );
}

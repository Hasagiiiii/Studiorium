import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function TechPage() {
  const { data } = useAppState();
  const resources = data?.techResources ?? [];

  return (
    <FeaturePage
      eyebrow="Oficina"
      title="Aprenda, construa e resolva"
      description="Tutoriais e projetos técnicos organizados sem herdar abas ou nomes antigos."
    >
      <section className="resource-grid">
        {resources.map((resource) => (
          <article key={resource.id} className="resource-card tech-card">
            <span className="eyebrow">{resource.hub} · {resource.category}</span>
            <h2><Link to={`/oficina/${encodeURIComponent(resource.slug)}`}>{resource.title}</Link></h2>
            <p>{resource.summary}</p>
          </article>
        ))}
      </section>
    </FeaturePage>
  );
}

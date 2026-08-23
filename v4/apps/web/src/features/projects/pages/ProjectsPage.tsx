import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function ProjectsPage() {
  const { data } = useAppState();
  const projects = data?.communityProjects ?? [];
  const codeProjects = data?.codeProjects ?? [];

  return (
    <FeaturePage
      eyebrow="Projetos"
      title="Crie, documente e compartilhe"
      description="Projetos acadêmicos, técnicos e experimentos de código em uma área única."
    >
      <div className="feature-actions">
        <Link className="button primary" to="/criar">Criar projeto</Link>
        <Link className="button secondary" to="/projetos/lab">Laboratório de código</Link>
      </div>
      <section className="resource-section">
        <header><h2>Projetos da comunidade</h2></header>
        <div className="resource-grid">
          {projects.map((project) => (
            <article key={project.id} className="resource-card project-card">
              <span className="eyebrow">{project.type}</span>
              <h3><Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link></h3>
              <p>{project.notes || 'Projeto compartilhado no Lorion.'}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="resource-section">
        <header><h2>Projetos de código</h2></header>
        <div className="resource-grid">
          {codeProjects.map((project) => (
            <article key={project.id} className="resource-card code-card">
              <span className="eyebrow">Código</span>
              <h3><Link to={`/projetos/lab/${encodeURIComponent(project.id)}`}>{project.title}</Link></h3>
              <p>{project.description}</p>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}

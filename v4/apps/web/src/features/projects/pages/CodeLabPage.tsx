import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CodeLabPage() {
  const { data } = useAppState();
  const me = data?.user;
  const projects =
    data?.codeProjects.filter(
      (item) => !me || item.ownerId === me.id || item.visibility === 'public',
    ) ?? [];

  return (
    <FeaturePage
      eyebrow="Projetos"
      title="Laboratório de código"
      description="Experimentos de código pertencem ao workspace de Projetos, não a uma área paralela."
    >
      <section className="resource-grid">
        {projects.length ? (
          projects.map((project) => (
            <article key={project.id} className="resource-card code-card">
              <span className="eyebrow">
                {project.visibility === 'public' ? 'Público' : 'Privado'}
              </span>
              <h2>
                <Link to={`/projetos/lab/${encodeURIComponent(project.id)}`}>{project.title}</Link>
              </h2>
              {project.description ? <p>{project.description}</p> : null}
            </article>
          ))
        ) : (
          <div className="empty-state">
            <p>Nenhum projeto de código disponível.</p>
          </div>
        )}
      </section>
    </FeaturePage>
  );
}

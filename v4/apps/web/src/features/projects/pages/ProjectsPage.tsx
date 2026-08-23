import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function ProjectsPage() {
  const { data } = useAppState();
  const me = data?.user;
  const projects = me ? data?.projects.filter((item) => item.ownerId === me.id) ?? [] : [];

  return (
    <FeaturePage
      eyebrow="Projetos"
      title="Seu espaço de criação"
      description="Crie, edite e organize projetos sem misturar o workspace pessoal com a descoberta pública do Lorion."
    >
      {me ? (
        <>
          <section className="project-workspace-actions">
            <button className="button primary" type="button" data-create-project>
              Novo projeto
            </button>
            <Link className="button secondary" to="/projetos/lab">
              Laboratório de código
            </Link>
          </section>
          <section className="resource-section">
            <header>
              <div>
                <span className="eyebrow">Workspace</span>
                <h2>Meus projetos</h2>
              </div>
            </header>
            {projects.length ? (
              <div className="resource-grid">
                {projects.map((project) => (
                  <article key={project.id} className="resource-card project-card">
                    <span className="eyebrow">{project.type}</span>
                    <h3><Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link></h3>
                    {project.notes ? <p>{project.notes}</p> : null}
                    <footer>{project.visibility === 'public' ? 'Público' : 'Privado'}</footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Você ainda não criou projetos.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="empty-state">
          <h2>Entre para criar e organizar projetos</h2>
          <p>A descoberta de projetos públicos continua disponível em Explorar.</p>
          <Link className="button primary" to="/entrar">Entrar</Link>
        </section>
      )}
    </FeaturePage>
  );
}

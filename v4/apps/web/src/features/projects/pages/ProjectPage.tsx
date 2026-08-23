import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function ProjectPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const project = data?.projects.find((item) => item.id === id);

  if (!project) {
    return (
      <FeaturePage
        eyebrow="Projeto"
        title="Projeto não encontrado"
        description="O projeto pode ser privado, ter sido removido ou o endereço está incorreto."
      >
        <Link to="/explorar?tipo=Projeto">Explorar projetos</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow={project.type}
      title={project.title}
      description={project.notes || 'Projeto compartilhado no Lorion.'}
    >
      <section className="project-detail">
        <div className="content-meta">
          <span>{project.visibility === 'public' ? 'Público' : 'Privado'}</span>
          <span>{project.sections.length} seções</span>
        </div>
      </section>
    </FeaturePage>
  );
}

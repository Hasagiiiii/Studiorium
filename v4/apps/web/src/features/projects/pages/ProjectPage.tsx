import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ProjectDetail } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { ProjectEditor } from '../components/ProjectEditor.js';

type State =
  | { status: 'loading'; value: ProjectDetail | null; error: null }
  | { status: 'ready'; value: ProjectDetail; error: null }
  | { status: 'error'; value: ProjectDetail | null; error: string };

export function ProjectPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading', value: null, error: null });

  const load = useCallback(async () => {
    if (!id) return;
    setState({ status: 'loading', value: null, error: null });
    try {
      const value = await services.projects.detail(id);
      setState({ status: 'ready', value, error: null });
    } catch (cause) {
      setState({
        status: 'error',
        value: null,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar o projeto.',
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return <FeaturePage eyebrow="Projeto" title="Carregando projeto…" description="Buscando workspace e permissões." />;
  }

  if (state.status === 'error' || !state.value) {
    return (
      <FeaturePage
        eyebrow="Projeto"
        title="Projeto não encontrado"
        description={state.error || 'O projeto pode ser privado, ter sido removido ou o endereço está incorreto.'}
      >
        <Link to="/explorar?tipo=Projeto">Explorar projetos</Link>
      </FeaturePage>
    );
  }

  const { project, isOwner } = state.value;

  return (
    <FeaturePage
      eyebrow={project.type}
      title={project.title}
      description={project.notes || (isOwner ? 'Seu workspace de projeto.' : 'Projeto compartilhado no Lorion.')}
    >
      <section className="project-detail">
        <div className="content-meta">
          <span>{project.visibility === 'public' ? 'Público' : 'Privado'}</span>
          <span>{project.sections.length} seções</span>
        </div>

        {isOwner ? (
          <ProjectEditor
            project={project}
            onUpdated={(updated) =>
              setState({ status: 'ready', error: null, value: { project: updated, isOwner: true } })
            }
          />
        ) : (
          <div className="project-reader">
            {project.sections.map((section, index) => (
              <article key={`${index}-${section.name}`} className="project-reader-section">
                <h2>{section.name}</h2>
                {section.content ? <p className="preserve-whitespace">{section.content}</p> : <p>Seção sem conteúdo publicado.</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </FeaturePage>
  );
}

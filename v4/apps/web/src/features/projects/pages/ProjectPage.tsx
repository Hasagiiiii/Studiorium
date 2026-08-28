import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

function formatDate(value: string | null) {
  if (!value) return 'Data indisponível';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ProjectPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const project = data?.projects.find((item) => item.id === id);

  if (!project) {
    return (
      <main className="project-reading project-reading--empty">
        <section className="project-reading__empty" aria-labelledby="project-missing-title">
          <span className="project-reading__eyebrow">Projeto</span>
          <h1 id="project-missing-title">Projeto não encontrado</h1>
          <p>O projeto pode ser privado, ter sido removido ou o endereço está incorreto.</p>
          <Link className="project-reading__back" to="/explorar?tipo=Projeto">
            Explorar projetos
          </Link>
        </section>
      </main>
    );
  }

  const updatedLabel = formatDate(project.updatedAt);

  return (
    <main className="project-reading">
      <article className="project-reading__article">
        <Link className="project-reading__back" to="/explorar?tipo=Projeto">
          ← Voltar para projetos
        </Link>

        <header className="project-reading__header">
          <div className="project-reading__kicker">
            <span>{project.type}</span>
            <span>{project.visibility === 'public' ? 'Público' : 'Privado'}</span>
          </div>
          <h1>{project.title}</h1>
          <p className="project-reading__lead">
            {project.notes || 'Projeto compartilhado no Studiorium.'}
          </p>
        </header>

        <section className="project-reading__summary" aria-label="Resumo do projeto">
          <div>
            <strong>{project.sections.length}</strong>
            <span>{project.sections.length === 1 ? 'seção' : 'seções'}</span>
          </div>
          <div>
            <strong>{project.visibility === 'public' ? 'Aberto' : 'Restrito'}</strong>
            <span>visibilidade</span>
          </div>
          <div>
            <strong>{updatedLabel}</strong>
            <span>última atualização</span>
          </div>
        </section>

        <section className="project-reading__structure" aria-labelledby="project-structure-title">
          <div>
            <span className="project-reading__eyebrow">Estrutura</span>
            <h2 id="project-structure-title">Organização do projeto</h2>
          </div>
          <p>
            {project.sections.length
              ? `Este projeto reúne ${project.sections.length} ${project.sections.length === 1 ? 'seção organizada' : 'seções organizadas'} para acompanhar seu conteúdo.`
              : 'Este projeto ainda não possui seções registradas.'}
          </p>
        </section>
      </article>
    </main>
  );
}

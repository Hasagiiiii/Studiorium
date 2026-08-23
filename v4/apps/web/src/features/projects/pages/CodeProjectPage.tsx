import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function CodeProjectPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const project = data?.codeProjects.find((item) => item.id === id);

  if (!project) {
    return (
      <FeaturePage
        eyebrow="Laboratório de código"
        title="Projeto não encontrado"
        description="O projeto pode ser privado, ter sido removido ou o endereço está incorreto."
      >
        <Link to="/projetos/lab">Voltar ao laboratório</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow="Código"
      title={project.title}
      description={project.description || 'Projeto de código no Lorion.'}
    >
      <section className="empty-state">
        <p>O editor isolado deste projeto será carregado aqui sem reutilizar o editor legado.</p>
      </section>
    </FeaturePage>
  );
}

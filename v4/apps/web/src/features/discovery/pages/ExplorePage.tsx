import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function ExplorePage() {
  const { data } = useAppState();

  const sections = [
    { label: 'Pessoas', count: data?.profiles.length ?? 0, to: '/pessoas' },
    { label: 'Comunidades', count: data?.communities.length ?? 0, to: '/comunidades' },
    { label: 'Livros', count: data?.books.length ?? 0, to: '/biblioteca' },
    { label: 'Pesquisas', count: data?.publications.length ?? 0, to: '/biblioteca' },
    { label: 'Projetos', count: data?.communityProjects.length ?? 0, to: '/projetos' },
    { label: 'Oficina', count: data?.techResources.length ?? 0, to: '/oficina' },
    { label: 'Notícias', count: data?.news.length ?? 0, to: '/noticias' },
  ];

  return (
    <FeaturePage
      eyebrow="Explorar"
      title="Descubra novas conexões"
      description="Navegue por pessoas, comunidades e conhecimento sem depender de abas históricas."
    >
      <section className="explore-grid">
        {sections.map((section) => (
          <Link key={section.label} className="explore-card" to={section.to}>
            <strong>{section.label}</strong>
            <span>{section.count}</span>
          </Link>
        ))}
      </section>
    </FeaturePage>
  );
}

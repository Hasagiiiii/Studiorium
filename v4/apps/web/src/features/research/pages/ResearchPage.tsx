import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function ResearchPage() {
  const { slug = '' } = useParams();
  const { data } = useAppState();
  const publication = data?.publications.find((item) => item.slug === slug);

  if (!publication) {
    return (
      <FeaturePage
        eyebrow="Pesquisa"
        title="Pesquisa não encontrada"
        description="A publicação pode estar em revisão, ter sido removida ou o endereço está incorreto."
      >
        <Link to="/explorar?tipo=Pesquisa">Explorar pesquisas</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow={publication.area}
      title={publication.title}
      description={publication.authorName}
    >
      <article className="longform-content">
        {publication.abstract ? (
          <section>
            <h2>Resumo</h2>
            <p>{publication.abstract}</p>
          </section>
        ) : null}
        {publication.content ? (
          <section>
            <h2>Conteúdo</h2>
            <p>{publication.content}</p>
          </section>
        ) : null}
        {publication.keywords.length ? (
          <footer className="tag-list">
            {publication.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </footer>
        ) : null}
      </article>
    </FeaturePage>
  );
}

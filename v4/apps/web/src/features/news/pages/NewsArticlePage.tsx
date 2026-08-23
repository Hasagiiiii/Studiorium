import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function NewsArticlePage() {
  const { slug = '' } = useParams();
  const { data } = useAppState();
  const article = data?.news.find((item) => item.slug === slug);

  if (!article) {
    return (
      <FeaturePage
        eyebrow="Notícia"
        title="Notícia não encontrada"
        description="A matéria pode ter sido arquivada ou o endereço está incorreto."
      >
        <Link to="/explorar?tipo=Notícia">Explorar notícias</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage eyebrow={article.category} title={article.title} description={article.authorName}>
      <article className="longform-content">
        {article.summary ? <p className="lead">{article.summary}</p> : null}
        {article.body ? <p>{article.body}</p> : null}
        <footer className="content-meta">
          <span>{article.likeCount} curtidas</span>
          {article.certifiedAt ? <span>Conteúdo editorial certificado</span> : null}
        </footer>
      </article>
    </FeaturePage>
  );
}

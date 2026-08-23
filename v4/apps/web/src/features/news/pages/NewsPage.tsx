import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function NewsPage() {
  const { data } = useAppState();
  const articles = data?.news ?? [];

  return (
    <FeaturePage
      eyebrow="Notícias"
      title="Informação com fonte e contexto"
      description="Conteúdo editorial certificado e conectado às áreas de interesse da comunidade."
    >
      <section className="resource-grid">
        {articles.map((article) => (
          <article key={article.id} className="resource-card news-card">
            <span className="eyebrow">{article.category}</span>
            <h2><Link to={`/noticias/${encodeURIComponent(article.slug)}`}>{article.title}</Link></h2>
            <p>{article.summary}</p>
          </article>
        ))}
      </section>
    </FeaturePage>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

function formatPublishedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

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
        <Link className="news-reader-back" to="/explorar?tipo=Notícia">
          Voltar para notícias
        </Link>
      </FeaturePage>
    );
  }

  const publishedAt = formatPublishedAt(article.publishedAt);
  const paragraphs = article.body
    ? article.body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <main id="main-content" className="news-reader">
      <div className="news-reader-shell">
        <Link className="news-reader-back" to="/explorar?tipo=Notícia">
          ← Voltar para notícias
        </Link>

        <article className="news-reader-article">
          <header className="news-reader-header">
            <div className="news-reader-kicker">
              <span className="eyebrow">{article.category}</span>
              {article.featured ? <span className="news-reader-featured">Destaque</span> : null}
            </div>
            <h1>{article.title}</h1>
            <div className="news-reader-byline" aria-label="Informações da publicação">
              <span>Por {article.authorName}</span>
              {publishedAt ? (
                <time dateTime={article.publishedAt ?? undefined}>{publishedAt}</time>
              ) : null}
            </div>
          </header>

          {article.summary ? <p className="news-reader-lead">{article.summary}</p> : null}

          <div className="news-reader-body">
            {paragraphs.length
              ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              : null}
          </div>

          <footer className="news-reader-footer">
            <span>{article.likeCount} curtidas</span>
            {article.certifiedAt ? (
              <span className="news-reader-certified">Conteúdo editorial certificado</span>
            ) : null}
          </footer>
        </article>
      </div>
    </main>
  );
}

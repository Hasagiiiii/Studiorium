import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ResearchPage() {
  const { slug = '' } = useParams();
  const { data } = useAppState();
  const publication = data?.publications.find((item) => item.slug === slug);

  if (!publication) {
    return (
      <main id="main-content" className="research-reader research-reader--empty">
        <section className="research-reader-empty" aria-labelledby="research-empty-title">
          <span className="eyebrow">Pesquisa</span>
          <h1 id="research-empty-title">Pesquisa não encontrada</h1>
          <p>A publicação pode estar em revisão, ter sido removida ou o endereço está incorreto.</p>
          <Link className="research-reader-back" to="/explorar?tipo=Pesquisa">
            Explorar pesquisas
          </Link>
        </section>
      </main>
    );
  }

  const publishedAt = formatDate(publication.publishedAt);
  const abstractParagraphs = publication.abstract ? paragraphs(publication.abstract) : [];
  const contentParagraphs = publication.content ? paragraphs(publication.content) : [];

  return (
    <main id="main-content" className="research-reader">
      <div className="research-reader-shell">
        <Link className="research-reader-back" to="/explorar?tipo=Pesquisa">
          ← Voltar para pesquisas
        </Link>

        <article className="research-reader-article">
          <header className="research-reader-header">
            <div className="research-reader-kicker">
              <span className="eyebrow">{publication.area}</span>
              {publication.featured ? (
                <span className="research-reader-featured">Destaque</span>
              ) : null}
            </div>
            <h1>{publication.title}</h1>
            <p className="research-reader-author">Por {publication.authorName}</p>
            <dl className="research-reader-meta" aria-label="Informações da pesquisa">
              <div>
                <dt>Nível</dt>
                <dd>{publication.level}</dd>
              </div>
              {publishedAt ? (
                <div>
                  <dt>Publicada</dt>
                  <dd>
                    <time dateTime={publication.publishedAt ?? undefined}>{publishedAt}</time>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Visualizações</dt>
                <dd>{publication.views}</dd>
              </div>
            </dl>
          </header>

          {abstractParagraphs.length ? (
            <section className="research-reader-abstract" aria-labelledby="research-abstract-title">
              <h2 id="research-abstract-title">Resumo</h2>
              {abstractParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}

          {contentParagraphs.length ? (
            <section className="research-reader-body" aria-labelledby="research-content-title">
              <h2 id="research-content-title">Conteúdo</h2>
              {contentParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}

          <footer className="research-reader-footer">
            {publication.keywords.length ? (
              <div className="research-reader-keywords" aria-label="Palavras-chave">
                {publication.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            ) : null}
            <div className="research-reader-stats" aria-label="Métricas da publicação">
              <span>{publication.downloads} downloads</span>
              <span>{publication.boosts} impulsos</span>
              {publication.license ? <span>{publication.license}</span> : null}
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}

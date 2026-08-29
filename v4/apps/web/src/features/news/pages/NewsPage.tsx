import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

function formatDate(value: string | null): string {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function NewsPage() {
  const { data } = useAppState();
  const articles = [...(data?.news ?? [])]
    .filter((article) => article.status === 'published')
    .sort((a, b) => {
      const aTime = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
  const featured = articles.find((article) => article.featured) ?? articles[0] ?? null;
  const recent = featured ? articles.filter((article) => article.id !== featured.id) : articles;

  return (
    <main className="news-index" aria-labelledby="news-index-title">
      <section className="news-index-shell">
        <header className="news-index-header">
          <div>
            <p className="news-index-eyebrow">Leitura editorial</p>
            <h1 id="news-index-title">Notícias</h1>
            <p>
              Atualizações publicadas no Studiorium, organizadas para leitura rápida antes de abrir
              a matéria completa.
            </p>
          </div>
          <Link className="news-index-explore" to="/explorar">
            Ir para Explorar
          </Link>
        </header>

        {!featured ? (
          <section className="news-index-empty" aria-live="polite">
            <span aria-hidden="true">✦</span>
            <h2>Ainda não há notícias publicadas</h2>
            <p>
              Quando novas matérias forem publicadas, elas aparecerão aqui sem misturar rascunhos.
            </p>
            <Link to="/">Voltar ao feed</Link>
          </section>
        ) : (
          <>
            <article className="news-index-featured">
              <div className="news-index-meta">
                <span>{featured.category}</span>
                {featured.featured ? <strong>Destaque</strong> : null}
              </div>
              <h2>
                <Link to={`/noticias/${featured.slug}`}>{featured.title}</Link>
              </h2>
              {featured.summary ? <p>{featured.summary}</p> : null}
              <footer>
                <span>{featured.authorName}</span>
                <time dateTime={featured.publishedAt ?? featured.createdAt ?? undefined}>
                  {formatDate(featured.publishedAt ?? featured.createdAt)}
                </time>
              </footer>
            </article>

            <section className="news-index-recent" aria-labelledby="news-index-recent-title">
              <div className="news-index-section-heading">
                <h2 id="news-index-recent-title">Mais recentes</h2>
                <span>{recent.length} publicações</span>
              </div>

              {recent.length ? (
                <div className="news-index-list">
                  {recent.map((article) => (
                    <article className="news-index-card" key={article.id}>
                      <div className="news-index-meta">
                        <span>{article.category}</span>
                        {article.certifiedBy ? <strong>Certificada</strong> : null}
                      </div>
                      <h3>
                        <Link to={`/noticias/${article.slug}`}>{article.title}</Link>
                      </h3>
                      {article.summary ? <p>{article.summary}</p> : null}
                      <footer>
                        <span>{article.authorName}</span>
                        <time dateTime={article.publishedAt ?? article.createdAt ?? undefined}>
                          {formatDate(article.publishedAt ?? article.createdAt)}
                        </time>
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="news-index-single-note">Este é o único artigo publicado até agora.</p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

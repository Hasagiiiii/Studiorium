import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function LibraryPage() {
  const { data } = useAppState();
  const books = data?.books ?? [];
  const research = data?.publications ?? [];

  return (
    <FeaturePage
      eyebrow="Biblioteca"
      title="Livros e pesquisas"
      description="Um acervo vivo ligado ao que as pessoas estudam, publicam e recomendam."
    >
      <section className="resource-section">
        <header><h2>Livros</h2></header>
        <div className="resource-grid">
          {books.map((book) => (
            <article key={book.id} className="resource-card book-card">
              <span className="eyebrow">{book.category}</span>
              <h3><Link to={`/livros/${encodeURIComponent(book.id)}`}>{book.title}</Link></h3>
              <p>{book.author}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="resource-section">
        <header><h2>Pesquisas</h2></header>
        <div className="resource-grid">
          {research.map((item) => (
            <article key={item.id} className="resource-card research-card">
              <span className="eyebrow">{item.area}</span>
              <h3><Link to={`/pesquisas/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h3>
              <p>{item.abstract}</p>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}

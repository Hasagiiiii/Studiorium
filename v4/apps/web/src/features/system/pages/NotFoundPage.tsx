import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main id="main-content" className="system-state">
      <span className="eyebrow">Lorion</span>
      <h1>Esta página não existe.</h1>
      <p>O endereço pode pertencer a uma versão antiga ou ter sido removido.</p>
      <Link className="button primary" to="/">
        Voltar ao início
      </Link>
    </main>
  );
}

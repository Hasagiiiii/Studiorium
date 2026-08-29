import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main id="main-content" className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-card">
        <div className="not-found-copy">
          <span className="eyebrow">Lorion · caminho não encontrado</span>
          <p className="not-found-code" aria-hidden="true">
            404
          </p>
          <h1 id="not-found-title">Esta página não está mais aqui.</h1>
          <p className="not-found-lead">
            O endereço pode ter mudado, pertencer a uma versão antiga ou apontar para um conteúdo
            que foi removido.
          </p>
        </div>

        <div className="not-found-actions" aria-label="Opções para continuar navegando">
          <Link className="button primary" to="/">
            Voltar ao início
          </Link>
          <Link className="button" to="/explorar">
            Ir para Explorar
          </Link>
        </div>

        <p className="not-found-hint">
          Se você chegou aqui por um favorito antigo, procure o conteúdo novamente em Explorar.
        </p>
      </section>
    </main>
  );
}

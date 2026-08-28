import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  note?: ReactNode;
};

export function AuthSurface({ eyebrow, title, description, children, note }: AuthSurfaceProps) {
  return (
    <main className="auth-surface" aria-labelledby="auth-title">
      <section className="auth-surface__intro" aria-label="Studiorium">
        <Link className="auth-surface__brand" to="/" aria-label="Voltar ao início do Studiorium">
          <span className="auth-surface__seal" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Studiorium</strong>
            <small>conhecimento em comunidade</small>
          </span>
        </Link>
        <div className="auth-surface__copy">
          <span className="auth-surface__eyebrow">{eyebrow}</span>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        <p className="auth-surface__promise">
          Um espaço para aprender, publicar e participar sem perder o foco no conteúdo.
        </p>
      </section>

      <section className="auth-surface__panel">
        <div className="auth-surface__card">{children}</div>
        {note ? <div className="auth-surface__note">{note}</div> : null}
      </section>
    </main>
  );
}

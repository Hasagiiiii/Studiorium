import { Link, useSearchParams } from 'react-router-dom';
import type { ProfileDetail } from '@lorion/contracts';
import { BookCover } from '../../library/components/BookCover.js';

type Props = {
  detail: ProfileDetail;
  updatingBookshelfPrivacy: boolean;
  onBookshelfPrivacyChange: (value: boolean) => void;
};

const shelfLabels: Record<string, string> = {
  want_to_read: 'Quero ler',
  reading: 'Lendo',
  read: 'Lido',
  abandoned: 'Abandonado',
};

const tabs = [
  ['posts', 'Publicações'],
  ['research', 'Pesquisas'],
  ['projects', 'Projetos'],
  ['communities', 'Comunidades'],
  ['books', 'Estante'],
] as const;

type Tab = (typeof tabs)[number][0];

export function ProfileContent({ detail, updatingBookshelfPrivacy, onBookshelfPrivacyChange }: Props) {
  const { profile } = detail;
  const [params, setParams] = useSearchParams();
  const requested = params.get('aba') as Tab | null;
  const active: Tab = tabs.some(([value]) => value === requested) ? (requested as Tab) : 'posts';

  function selectTab(tab: Tab) {
    const next = new URLSearchParams(params);
    if (tab === 'posts') next.delete('aba');
    else next.set('aba', tab);
    setParams(next, { replace: true });
  }

  return (
    <section className="social-profile-content">
      <nav className="social-profile-tabs" aria-label="Conteúdo do perfil">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={active === value ? 'active' : ''}
            type="button"
            onClick={() => selectTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {active === 'posts' ? (
        <section className="profile-content-section profile-post-grid" aria-label="Publicações">
          {detail.posts.length ? (
            detail.posts.map((post) => (
              <article key={post.id} className="profile-social-post">
                <div className="profile-social-post-meta">
                  <strong>@{profile.username}</strong>
                  {post.community ? (
                    <Link to={`/comunidades/${encodeURIComponent(post.community.slug)}`}>{post.community.name}</Link>
                  ) : null}
                </div>
                {post.title ? <h2><Link to={`/publicacoes/${encodeURIComponent(post.id)}`}>{post.title}</Link></h2> : null}
                <p>{post.body}</p>
                <Link className="profile-post-open" to={`/publicacoes/${encodeURIComponent(post.id)}`}>Ver publicação</Link>
              </article>
            ))
          ) : (
            <div className="empty-state"><h2>Nenhuma publicação ainda.</h2><p>As publicações visíveis deste perfil aparecerão aqui.</p></div>
          )}
        </section>
      ) : null}

      {active === 'research' ? (
        <section className="profile-content-section">
          <div className="resource-grid">
            {detail.publications.length ? detail.publications.map((publication) => (
              <article className="resource-card" key={publication.id}>
                <span className="eyebrow">Pesquisa</span>
                <h2><Link to={`/pesquisas/${encodeURIComponent(publication.slug)}`}>{publication.title}</Link></h2>
                {publication.area ? <p>{publication.area}</p> : null}
              </article>
            )) : <div className="empty-state"><h2>Nenhuma pesquisa publicada.</h2></div>}
          </div>
        </section>
      ) : null}

      {active === 'projects' ? (
        <section className="profile-content-section">
          <div className="resource-grid">
            {detail.projects.length ? detail.projects.map((project) => (
              <article className="resource-card" key={project.id}>
                <span className="eyebrow">Projeto</span>
                <h2><Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link></h2>
                {project.type ? <p>{project.type}</p> : null}
              </article>
            )) : <div className="empty-state"><h2>Nenhum projeto público.</h2></div>}
          </div>
        </section>
      ) : null}

      {active === 'communities' ? (
        <section className="profile-content-section">
          <div className="resource-grid">
            {detail.communities.length ? detail.communities.map((community) => (
              <article className="resource-card" key={community.id}>
                <span className="eyebrow">{community.official ? 'Comunidade oficial' : 'Comunidade'}</span>
                <h2><Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>{community.name}</Link></h2>
                <p>{community.area} · {community.role}</p>
              </article>
            )) : <div className="empty-state"><h2>Nenhuma comunidade visível.</h2></div>}
          </div>
        </section>
      ) : null}

      {active === 'books' ? (
        <section className="profile-content-section">
          <div className="profile-bookshelf-heading">
            <h2>Estante</h2>
            {detail.isOwnProfile ? (
              <label>
                <input
                  type="checkbox"
                  checked={profile.bookshelfPublic}
                  disabled={updatingBookshelfPrivacy}
                  onChange={(event) => onBookshelfPrivacyChange(event.target.checked)}
                />{' '}
                Exibir publicamente
              </label>
            ) : null}
          </div>
          {!detail.isOwnProfile && !profile.bookshelfPublic ? (
            <div className="empty-state"><h2>Estante privada.</h2></div>
          ) : detail.bookshelf.length ? (
            <div className="book-rail profile-book-rail" aria-label="Livros da estante">
              {detail.bookshelf.map((item) => (
                <article className="book-tile" key={item.book.id}>
                  <Link className="book-cover-link" to={`/livros/${encodeURIComponent(item.book.id)}`}>
                    <BookCover book={item.book} />
                  </Link>
                  <div className="book-tile-copy">
                    <span className="eyebrow">{shelfLabels[item.shelfStatus] || item.shelfStatus}</span>
                    <h3><Link to={`/livros/${encodeURIComponent(item.book.id)}`}>{item.book.title}</Link></h3>
                    <p>{item.book.author}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h2>A estante ainda está vazia.</h2></div>
          )}
        </section>
      ) : null}
    </section>
  );
}

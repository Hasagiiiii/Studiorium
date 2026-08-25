import { Link, useSearchParams } from 'react-router-dom';
import type { ProfileDetail } from '@lorion/contracts';
import { BookCarousel } from '../../library/components/BookCarousel.js';

type Props = {
  detail: ProfileDetail;
  updatingBookshelfPrivacy: boolean;
  onBookshelfPrivacyChange: (value: boolean) => void;
};

const shelfOrder = ['reading', 'want_to_read', 'read', 'abandoned'] as const;
type ShelfSection = (typeof shelfOrder)[number];

const shelfLabels: Record<ShelfSection, string> = {
  want_to_read: 'Quero ler',
  reading: 'Lendo',
  read: 'Lidos',
  abandoned: 'Abandonados',
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
        <section className="profile-content-section profile-bookshelf-section">
          <div className="profile-bookshelf-heading">
            <div>
              <h2>Estante</h2>
              <p>{detail.bookshelf.length} {detail.bookshelf.length === 1 ? 'livro salvo' : 'livros salvos'}</p>
            </div>
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
            <div className="profile-bookshelf-groups">
              {shelfOrder.map((status) => {
                const items = detail.bookshelf.filter((item) => item.shelfStatus === status);
                const label = shelfLabels[status];
                return items.length ? (
                  <BookCarousel
                    key={status}
                    title={label}
                    items={items.map((item) => ({ book: item.book }))}
                    ariaLabel={`${label} de ${profile.displayName}`}
                  />
                ) : null;
              })}
            </div>
          ) : (
            <div className="empty-state"><h2>A estante ainda está vazia.</h2></div>
          )}
        </section>
      ) : null}
    </section>
  );
}

import { Link } from 'react-router-dom';
import type { ProfileDetail } from '@lorion/contracts';

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

export function ProfileContent({
  detail,
  updatingBookshelfPrivacy,
  onBookshelfPrivacyChange,
}: Props) {
  const { profile } = detail;

  return (
    <div className="profile-content-sections">
      <section className="profile-content-section">
        <h2>Publicações</h2>
        {detail.publications.length ? (
          <ul>
            {detail.publications.map((publication) => (
              <li key={publication.id}>
                <Link to={`/pesquisas/${encodeURIComponent(publication.slug)}`}>
                  {publication.title}
                </Link>
                {publication.area ? <span> · {publication.area}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma publicação pública deste autor.</p>
        )}
      </section>

      <section className="profile-content-section">
        <h2>Projetos públicos</h2>
        {detail.projects.length ? (
          <ul>
            {detail.projects.map((project) => (
              <li key={project.id}>
                <Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link>
                {project.type ? <span> · {project.type}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum projeto público disponível.</p>
        )}
      </section>

      <section className="profile-content-section">
        <h2>Comunidades</h2>
        {detail.communities.length ? (
          <ul>
            {detail.communities.map((community) => (
              <li key={community.id}>
                <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>
                  {community.name}
                </Link>
                <span> · {community.role}</span>
                {community.official ? <span> · oficial</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma comunidade visível neste perfil.</p>
        )}
      </section>

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
              Exibir minha estante no perfil público
            </label>
          ) : null}
        </div>

        {!detail.isOwnProfile && !profile.bookshelfPublic ? (
          <p>Esta estante é privada.</p>
        ) : detail.bookshelf.length ? (
          <ul>
            {detail.bookshelf.map((item) => (
              <li key={item.book.id}>
                <Link to={`/livros/${encodeURIComponent(item.book.id)}`}>{item.book.title}</Link>
                <span> · {item.book.author}</span>
                <span> · {shelfLabels[item.shelfStatus] || item.shelfStatus}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>A estante ainda está vazia.</p>
        )}
      </section>
    </div>
  );
}

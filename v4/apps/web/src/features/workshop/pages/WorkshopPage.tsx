import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

const TECH_TERMS = [
  'tecnologia',
  'tech',
  'computador',
  'pc',
  'celular',
  'hardware',
  'software',
  'programação',
  'programacao',
  'código',
  'codigo',
  'jogo',
  'game',
  'manutenção',
  'manutencao',
  'eletrônica',
  'eletronica',
  'robótica',
  'robotica',
  'rede',
  'internet',
  'linux',
  'windows',
  'android',
  'ios',
];

function normalizedText(...values: Array<string | null | undefined>): string {
  return values
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isTechnical(...values: Array<string | null | undefined>): boolean {
  const text = normalizedText(...values);
  return TECH_TERMS.some((term) => text.includes(normalizedText(term)));
}

export function WorkshopPage() {
  const { data } = useAppState();

  const communities = useMemo(
    () =>
      (data?.communities ?? [])
        .filter(
          (community) =>
            community.status === 'active' &&
            community.visibility !== 'private' &&
            isTechnical(community.name, community.area, community.description),
        )
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 6),
    [data],
  );

  const discussions = useMemo(
    () =>
      (data?.discussions ?? [])
        .filter(
          (discussion) =>
            discussion.status === 'published' &&
            isTechnical(discussion.title, discussion.body, discussion.category),
        )
        .slice(0, 8),
    [data],
  );

  const posts = useMemo(
    () =>
      (data?.posts ?? [])
        .filter(
          (post) =>
            post.moderationStatus === 'clear' &&
            isTechnical(post.title, post.body, post.community?.name),
        )
        .slice(0, 6),
    [data],
  );

  const projects = useMemo(
    () =>
      (data?.projects ?? [])
        .filter(
          (project) =>
            !project.deletedAt &&
            project.visibility === 'public' &&
            isTechnical(project.title, project.type, project.notes),
        )
        .slice(0, 6),
    [data],
  );

  const total = communities.length + discussions.length + posts.length + projects.length;

  return (
    <main id="main-content" className="workshop-page">
      <header className="workshop-hero">
        <div>
          <span className="eyebrow">Oficina</span>
          <h1>Tecnologia feita em comunidade.</h1>
          <p>
            Encontre conversas, projetos e pessoas trocando prática sobre computadores, software,
            jogos, manutenção e criação digital.
          </p>
        </div>
        <div className="workshop-hero-actions">
          <Link className="button primary" to="/comunidades">
            Encontrar comunidades
          </Link>
          <Link className="button" to="/explorar?foco=busca">
            Pesquisar no Lorion
          </Link>
        </div>
      </header>

      <section className="workshop-summary" aria-label="Resumo da Oficina">
        <div>
          <strong>{communities.length}</strong>
          <span>comunidades</span>
        </div>
        <div>
          <strong>{discussions.length + posts.length}</strong>
          <span>conversas e posts</span>
        </div>
        <div>
          <strong>{projects.length}</strong>
          <span>projetos públicos</span>
        </div>
      </section>

      {total ? (
        <div className="workshop-sections">
          <section className="workshop-section">
            <header>
              <div>
                <span className="social-section-kicker">Pessoas e prática</span>
                <h2>Comunidades da Oficina</h2>
              </div>
              <Link to="/comunidades">Ver todas</Link>
            </header>
            {communities.length ? (
              <div className="workshop-community-grid">
                {communities.map((community) => (
                  <article key={community.id} className="workshop-community-card">
                    <span className="eyebrow">{community.area}</span>
                    <h3>
                      <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>
                        {community.name}
                      </Link>
                    </h3>
                    <p>{community.description || 'Uma comunidade para aprender e construir junto.'}</p>
                    <footer>
                      <span>{community.memberCount} membros</span>
                      <Link to={`/comunidades/${encodeURIComponent(community.slug)}`}>Abrir →</Link>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <p>Ainda não há comunidades técnicas em destaque.</p>
                <Link to="/comunidades">Explorar comunidades</Link>
              </div>
            )}
          </section>

          <section className="workshop-section">
            <header>
              <div>
                <span className="social-section-kicker">Troca rápida</span>
                <h2>Discussões para entrar agora</h2>
              </div>
            </header>
            {discussions.length ? (
              <div className="workshop-discussion-list">
                {discussions.map((discussion) => (
                  <article key={discussion.id}>
                    <div>
                      <span className="eyebrow">{discussion.category}</span>
                      <h3>
                        <Link to={`/discussoes/${encodeURIComponent(discussion.id)}`}>
                          {discussion.title}
                        </Link>
                      </h3>
                      <p>{discussion.body || `Conversa iniciada por ${discussion.authorName}.`}</p>
                    </div>
                    <span>{discussion.replyCount} respostas</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <h3>A bancada está livre.</h3>
                <p>Entre em uma comunidade e comece uma conversa prática.</p>
                <Link to="/comunidades">Ir para Comunidades</Link>
              </div>
            )}
          </section>

          <section className="workshop-section workshop-two-column">
            <div>
              <header>
                <div>
                  <span className="social-section-kicker">Em construção</span>
                  <h2>Projetos públicos</h2>
                </div>
                <Link to="/projetos">Seus projetos</Link>
              </header>
              {projects.length ? (
                <div className="workshop-project-list">
                  {projects.map((project) => (
                    <Link key={project.id} to={`/projetos/${encodeURIComponent(project.id)}`}>
                      <span>{project.type}</span>
                      <strong>{project.title}</strong>
                      <small>{project.sections.length} seções</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact">
                  <p>Nenhum projeto técnico público apareceu por aqui ainda.</p>
                  <Link to="/projetos">Abrir Projetos</Link>
                </div>
              )}
            </div>

            <div>
              <header>
                <div>
                  <span className="social-section-kicker">Da rede</span>
                  <h2>Publicações técnicas</h2>
                </div>
              </header>
              {posts.length ? (
                <div className="workshop-post-list">
                  {posts.map((post) => (
                    <article key={post.id}>
                      <span className="eyebrow">{post.community?.name || 'Publicação'}</span>
                      <h3>
                        <Link to={`/publicacoes/${encodeURIComponent(post.id)}`}>
                          {post.title || post.body.slice(0, 72)}
                        </Link>
                      </h3>
                      <p>{post.body}</p>
                      <footer>
                        <span>{post.interactions.likeCount} curtidas</span>
                        <span>{post.interactions.commentCount} comentários</span>
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact">
                  <p>As publicações técnicas aparecem aqui conforme a comunidade participa.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="workshop-empty empty-state">
          <span className="eyebrow">Oficina aberta</span>
          <h2>A primeira bancada ainda está sendo montada.</h2>
          <p>
            A Oficina cresce a partir do que as pessoas publicam no Lorion. Encontre uma comunidade
            ou crie um projeto para começar a formar esse espaço.
          </p>
          <div>
            <Link className="button primary" to="/comunidades">
              Encontrar comunidade
            </Link>
            <Link className="button" to="/projetos">
              Abrir Projetos
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

const CREATIVE_TERMS = [
  'arte',
  'artes',
  'design',
  'desenho',
  'ilustração',
  'ilustracao',
  'escrita',
  'texto',
  'literatura',
  'poesia',
  'roteiro',
  'redação',
  'redacao',
  'editorial',
  'edição',
  'edicao',
  'revisão',
  'revisao',
  'fotografia',
  'vídeo',
  'video',
  'música',
  'musica',
  'cinema',
  'pesquisa',
  'cultura',
];

function normalize(...values: Array<string | string[] | null | undefined>): string {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isCreative(...values: Array<string | string[] | null | undefined>): boolean {
  const text = normalize(...values);
  return CREATIVE_TERMS.some((term) => text.includes(normalize(term)));
}

export function AtelierPage() {
  const { data } = useAppState();

  const publications = useMemo(
    () =>
      (data?.publications ?? [])
        .filter((publication) =>
          isCreative(
            publication.title,
            publication.area,
            publication.abstract,
            publication.content,
            publication.keywords,
          ),
        )
        .sort((a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views)
        .slice(0, 6),
    [data],
  );

  const discussions = useMemo(
    () =>
      (data?.discussions ?? [])
        .filter(
          (discussion) =>
            discussion.status === 'published' &&
            isCreative(discussion.title, discussion.body, discussion.category),
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
            isCreative(project.title, project.type, project.notes),
        )
        .slice(0, 6),
    [data],
  );

  const posts = useMemo(
    () =>
      (data?.posts ?? [])
        .filter(
          (post) =>
            post.moderationStatus === 'clear' &&
            isCreative(post.title, post.body, post.community?.name),
        )
        .slice(0, 6),
    [data],
  );

  const total = publications.length + discussions.length + projects.length + posts.length;

  return (
    <main id="main-content" className="atelier-page">
      <header className="atelier-hero">
        <div>
          <span className="eyebrow">Ateliê</span>
          <h1>Ideias que ganham forma antes de virarem publicação.</h1>
          <p>
            Um recorte do Lorion para escrita, arte, pesquisa, revisão e projetos criativos. O Ateliê
            organiza o que já existe na plataforma, sem criar um editor paralelo ou uma segunda área
            de projetos.
          </p>
        </div>
        <div className="atelier-hero-actions">
          <Link className="button primary" to="/comunidades">
            Encontrar pessoas
          </Link>
          <Link className="button secondary" to="/explorar?foco=busca">
            Pesquisar trabalhos
          </Link>
        </div>
      </header>

      <section className="atelier-summary" aria-label="Resumo do Ateliê">
        <div>
          <strong>{publications.length}</strong>
          <span>leituras e pesquisas</span>
        </div>
        <div>
          <strong>{discussions.length + posts.length}</strong>
          <span>conversas criativas</span>
        </div>
        <div>
          <strong>{projects.length}</strong>
          <span>projetos públicos</span>
        </div>
      </section>

      {total ? (
        <div className="atelier-sections">
          <section className="atelier-section">
            <header>
              <div>
                <span className="social-section-kicker">Leitura e referência</span>
                <h2>Trabalhos para abrir na mesa</h2>
              </div>
              <Link to="/explorar?tipo=Pesquisa">Explorar pesquisas</Link>
            </header>
            {publications.length ? (
              <div className="atelier-reading-grid">
                {publications.map((publication) => (
                  <article key={publication.id} className="atelier-reading-card">
                    <span className="eyebrow">{publication.area}</span>
                    <h3>
                      <Link to={`/pesquisas/${encodeURIComponent(publication.slug)}`}>
                        {publication.title}
                      </Link>
                    </h3>
                    <p>{publication.abstract || 'Abra a publicação para continuar a leitura.'}</p>
                    <footer>
                      <span>Por {publication.authorName}</span>
                      <span>{publication.views} visualizações</span>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <p>Ainda não há leituras criativas em destaque.</p>
                <Link to="/explorar?tipo=Pesquisa">Explorar pesquisas</Link>
              </div>
            )}
          </section>

          <section className="atelier-section atelier-two-column">
            <div>
              <header>
                <div>
                  <span className="social-section-kicker">Mesa coletiva</span>
                  <h2>Discussões em andamento</h2>
                </div>
                <Link to="/comunidades">Comunidades</Link>
              </header>
              {discussions.length ? (
                <div className="atelier-discussion-list">
                  {discussions.map((discussion) => (
                    <Link key={discussion.id} to={`/discussoes/${encodeURIComponent(discussion.id)}`}>
                      <span>{discussion.category}</span>
                      <strong>{discussion.title}</strong>
                      <small>{discussion.replyCount} respostas</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact">
                  <h3>A mesa está silenciosa.</h3>
                  <p>Entre em uma comunidade para trocar referências, rascunhos e revisão.</p>
                  <Link to="/comunidades">Abrir Comunidades</Link>
                </div>
              )}
            </div>

            <div>
              <header>
                <div>
                  <span className="social-section-kicker">Em processo</span>
                  <h2>Projetos públicos</h2>
                </div>
                <Link to="/projetos">Seus projetos</Link>
              </header>
              {projects.length ? (
                <div className="atelier-project-list">
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
                  <p>Os projetos criativos públicos aparecem aqui conforme forem compartilhados.</p>
                  <Link to="/projetos">Abrir Projetos</Link>
                </div>
              )}
            </div>
          </section>

          <section className="atelier-section">
            <header>
              <div>
                <span className="social-section-kicker">Da rede</span>
                <h2>Publicações criativas</h2>
              </div>
            </header>
            {posts.length ? (
              <div className="atelier-post-grid">
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
                <p>Publicações de escrita, arte e criação vão aparecer aqui conforme a rede participa.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="atelier-empty empty-state">
          <span className="eyebrow">Ateliê aberto</span>
          <h2>O espaço ainda está esperando os primeiros trabalhos.</h2>
          <p>
            O Ateliê cresce a partir de pesquisas, projetos e conversas já publicadas no Lorion. Use
            as superfícies existentes para começar sem duplicar seu trabalho.
          </p>
          <div>
            <Link className="button primary" to="/comunidades">
              Encontrar comunidade
            </Link>
            <Link className="button secondary" to="/projetos">
              Abrir Projetos
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

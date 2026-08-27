import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

export function DeskPage() {
  const { data } = useAppState();
  const me = data?.user;

  if (!me) {
    return (
      <main className="desk-page desk-page--guest">
        <section className="desk-empty" aria-labelledby="desk-login-title">
          <span className="desk-kicker">Escrivaninha</span>
          <h1 id="desk-login-title">Seu espaço pessoal começa com uma conta.</h1>
          <p>Entre para acompanhar suas áreas de estudo, criação e participação no Lorion.</p>
          <Link className="desk-primary-action" to="/entrar?retorno=%2Fescrivaninha">
            Entrar na conta
          </Link>
        </section>
      </main>
    );
  }

  const ownProfile = me.username
    ? data?.profiles.find((profile) => profile.username === me.username)
    : null;
  const ownProjects = data?.projects.filter((project) => project.ownerId === me.id) ?? [];
  const ownPosts = data?.posts.filter((post) => post.authorId === me.id) ?? [];
  const ownDiscussions =
    data?.discussions.filter((discussion) => discussion.authorId === me.id) ?? [];
  const isAdmin = me.role === 'admin';

  return (
    <main className="desk-page">
      <header className="desk-hero">
        <div>
          <span className="desk-kicker">Escrivaninha</span>
          <h1>Olá, {me.displayName}.</h1>
          <p>Um panorama compacto do que é seu, sem tirar você do fluxo principal da plataforma.</p>
        </div>
        {me.username ? (
          <Link className="desk-secondary-action" to={`/perfil/${encodeURIComponent(me.username)}`}>
            Ver perfil
          </Link>
        ) : null}
      </header>

      <section className="desk-metrics" aria-label="Resumo da conta">
        <article>
          <strong>{ownPosts.length}</strong>
          <span>publicações</span>
        </article>
        <article>
          <strong>{ownDiscussions.length}</strong>
          <span>discussões</span>
        </article>
        <article>
          <strong>{ownProjects.length}</strong>
          <span>projetos</span>
        </article>
        <article>
          <strong>{ownProfile ? 'Ativo' : 'Pendente'}</strong>
          <span>perfil</span>
        </article>
      </section>

      <section className="desk-grid" aria-label="Atalhos da escrivaninha">
        <Link className="desk-card" to="/notificacoes">
          <span>Atividade</span>
          <strong>Notificações</strong>
          <p>Veja respostas, interações e atualizações que pedem sua atenção.</p>
        </Link>
        <Link className="desk-card" to="/projetos">
          <span>Criação</span>
          <strong>Projetos</strong>
          <p>Retome trabalhos e materiais em andamento.</p>
        </Link>
        <Link className="desk-card" to="/biblioteca">
          <span>Acervo</span>
          <strong>Biblioteca</strong>
          <p>Volte aos livros e reviews sem passar por telas intermediárias.</p>
        </Link>
        <Link className="desk-card" to="/conta/seguranca">
          <span>Conta</span>
          <strong>Segurança</strong>
          <p>Gerencie senha e proteção da sua conta.</p>
        </Link>
      </section>

      {isAdmin ? (
        <section className="desk-admin" aria-labelledby="desk-admin-title">
          <div>
            <span className="desk-kicker">Administração</span>
            <h2 id="desk-admin-title">Painel administrativo separado da experiência social.</h2>
            <p>
              Sua conta tem papel administrativo. Esta entrada fica isolada do perfil público e será
              a base para moderação, métricas e controles próprios do ADM.
            </p>
          </div>
          <span className="desk-admin-status" aria-label="Área administrativa em preparação">
            Base pronta
          </span>
        </section>
      ) : null}
    </main>
  );
}

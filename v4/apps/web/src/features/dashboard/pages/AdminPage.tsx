import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';

export function AdminPage() {
  const { data } = useAppState();
  const me = data?.user;

  if (!me) {
    return (
      <main className="admin-page admin-page--blocked">
        <section className="admin-blocked" aria-labelledby="admin-login-title">
          <span className="admin-kicker">Administração</span>
          <h1 id="admin-login-title">Entre com uma conta administrativa.</h1>
          <p>Esta superfície fica separada do fluxo social e exige uma sessão válida.</p>
          <Link className="admin-primary-action" to="/entrar?retorno=%2Fadmin">
            Entrar na conta
          </Link>
        </section>
      </main>
    );
  }

  if (me.role !== 'admin') {
    return (
      <main className="admin-page admin-page--blocked">
        <section className="admin-blocked" aria-labelledby="admin-denied-title">
          <span className="admin-kicker">Área restrita</span>
          <h1 id="admin-denied-title">Sua conta não possui acesso administrativo.</h1>
          <p>Seu perfil e suas atividades continuam disponíveis normalmente na Escrivaninha.</p>
          <Link className="admin-primary-action" to="/escrivaninha">
            Voltar à Escrivaninha
          </Link>
        </section>
      </main>
    );
  }

  const metrics = [
    { label: 'Perfis', value: data?.profiles.length ?? 0 },
    { label: 'Comunidades', value: data?.communities.length ?? 0 },
    { label: 'Publicações', value: data?.posts.length ?? 0 },
    { label: 'Discussões', value: data?.discussions.length ?? 0 },
    { label: 'Pesquisas', value: data?.publications.length ?? 0 },
    { label: 'Notícias', value: data?.news.length ?? 0 },
  ];

  return (
    <main className="admin-page">
      <header className="admin-hero">
        <div>
          <span className="admin-kicker">Administração</span>
          <h1>Visão operacional do Studiorium.</h1>
          <p>
            Um painel compacto para leitura do estado da plataforma, separado do perfil público e do
            feed social.
          </p>
        </div>
        <Link className="admin-secondary-action" to="/escrivaninha">
          Voltar à Escrivaninha
        </Link>
      </header>

      <section className="admin-metrics" aria-label="Resumo da plataforma">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="admin-sections" aria-label="Áreas administrativas">
        <article className="admin-section-card">
          <span className="admin-card-kicker">Comunidade</span>
          <h2>Moderação social</h2>
          <p>
            O painel usa apenas dados disponíveis hoje. Controles de aprovação ou remoção só entram
            quando houver endpoints administrativos explícitos para essas ações.
          </p>
          <Link to="/comunidades">Revisar comunidades</Link>
        </article>

        <article className="admin-section-card">
          <span className="admin-card-kicker">Conteúdo</span>
          <h2>Leitura editorial</h2>
          <p>
            Acompanhe as superfícies públicas sem duplicar o produto dentro do ADM nem criar ações
            fictícias.
          </p>
          <Link to="/explorar">Abrir Explorar</Link>
        </article>

        <article className="admin-section-card">
          <span className="admin-card-kicker">Conta</span>
          <h2>Segurança administrativa</h2>
          <p>
            Mantenha credenciais e sessões em uma área própria, sem misturar autorização com o tipo
            de perfil acadêmico ou social.
          </p>
          <Link to="/conta/seguranca">Gerenciar segurança</Link>
        </article>
      </section>
    </main>
  );
}

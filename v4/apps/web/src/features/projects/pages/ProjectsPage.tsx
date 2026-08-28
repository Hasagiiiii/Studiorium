import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

export function ProjectsPage() {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [params, setParams] = useSearchParams();
  const me = data?.user;
  const projects = me ? (data?.projects.filter((item) => item.ownerId === me.id) ?? []) : [];
  const publicCount = projects.filter((project) => project.visibility === 'public').length;
  const privateCount = projects.length - publicCount;
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');
  const creating = params.get('criar') === '1';

  function setCreating(open: boolean) {
    const next = new URLSearchParams(params);
    if (open) next.set('criar', '1');
    else next.delete('criar');
    setParams(next, { replace: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me || status === 'saving') return;
    setStatus('saving');
    setError('');
    try {
      const created = await services.projects.create({
        title: title.trim(),
        type: 'Projeto',
        visibility,
        notes: notes.trim(),
      });
      setTitle('');
      setNotes('');
      setVisibility('private');
      setCreating(false);
      await reload();
      setStatus('idle');
      pushToast({ message: `Projeto “${created.title}” criado.`, tone: 'success' });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível criar o projeto.';
      setStatus('error');
      setError(message);
      pushToast({ message, tone: 'error' });
    }
  }

  if (!me) {
    return (
      <main className="project-workspace project-workspace--guest">
        <section
          className="project-workspace-guest"
          aria-labelledby="project-workspace-guest-title"
        >
          <span className="eyebrow">Projetos</span>
          <h1 id="project-workspace-guest-title">Seu espaço de criação fica aqui.</h1>
          <p>
            Entre para organizar projetos privados ou publicar trabalhos que possam aparecer em
            Explorar.
          </p>
          <div className="project-workspace-guest__actions">
            <Link className="button primary" to="/entrar">
              Entrar
            </Link>
            <Link className="button ghost" to="/explorar">
              Ver projetos públicos
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="project-workspace">
      <header className="project-workspace-hero">
        <div>
          <span className="eyebrow">Workspace pessoal</span>
          <h1>Projetos</h1>
          <p>
            Organize rascunhos, estudos e trabalhos sem misturar seu espaço privado com a descoberta
            pública.
          </p>
        </div>
        <button
          className="button primary project-workspace-hero__action"
          type="button"
          aria-expanded={creating}
          aria-controls="project-create-panel"
          onClick={() => setCreating(!creating)}
        >
          {creating ? 'Fechar criação' : 'Novo projeto'}
        </button>
      </header>

      <section className="project-workspace-summary" aria-label="Resumo dos seus projetos">
        <div>
          <strong>{projects.length}</strong>
          <span>{projects.length === 1 ? 'projeto' : 'projetos'}</span>
        </div>
        <div>
          <strong>{privateCount}</strong>
          <span>privados</span>
        </div>
        <div>
          <strong>{publicCount}</strong>
          <span>públicos</span>
        </div>
      </section>

      {creating ? (
        <section id="project-create-panel" className="project-create-panel">
          <div className="project-create-panel__intro">
            <span className="eyebrow">Novo projeto</span>
            <h2>Comece com o essencial</h2>
            <p>
              Você pode desenvolver a estrutura depois. Defina agora apenas contexto e privacidade.
            </p>
          </div>
          <form
            className="project-create-panel__form"
            onSubmit={submit}
            aria-busy={status === 'saving'}
          >
            <label>
              Título
              <input
                required
                minLength={2}
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Visibilidade
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'private' | 'public')}
              >
                <option value="private">Privado — somente você</option>
                <option value="public">Público — pode aparecer em Explorar</option>
              </select>
            </label>
            <label>
              Notas
              <textarea
                maxLength={4000}
                rows={5}
                placeholder="Objetivo, contexto ou próximos passos…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            {status === 'error' ? (
              <p className="inline-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="project-create-panel__actions">
              <button className="button primary" type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? 'Criando…' : 'Criar projeto'}
              </button>
              <button className="button ghost" type="button" onClick={() => setCreating(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="project-workspace-list" aria-labelledby="project-workspace-list-title">
        <header className="project-workspace-list__header">
          <div>
            <span className="eyebrow">Seu acervo</span>
            <h2 id="project-workspace-list-title">Meus projetos</h2>
          </div>
          <Link className="text-link" to="/explorar">
            Explorar projetos públicos
          </Link>
        </header>

        {projects.length ? (
          <div className="project-workspace-grid">
            {projects.map((project) => (
              <article key={project.id} className="project-workspace-card">
                <div className="project-workspace-card__meta">
                  <span>{project.type}</span>
                  <span className={`project-visibility project-visibility--${project.visibility}`}>
                    {project.visibility === 'public' ? 'Público' : 'Privado'}
                  </span>
                </div>
                <h3>
                  <Link to={`/projetos/${encodeURIComponent(project.id)}`}>{project.title}</Link>
                </h3>
                <p>
                  {project.notes || 'Sem notas ainda. Abra o projeto para continuar estruturando.'}
                </p>
                <footer>
                  <span>
                    {project.sections.length} {project.sections.length === 1 ? 'seção' : 'seções'}
                  </span>
                  <Link to={`/projetos/${encodeURIComponent(project.id)}`}>Abrir projeto</Link>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="project-workspace-empty">
            <span aria-hidden="true">✦</span>
            <h3>Seu workspace ainda está vazio.</h3>
            <p>Crie um projeto para organizar uma ideia sem precisar publicá-la de imediato.</p>
            <button className="button primary" type="button" onClick={() => setCreating(true)}>
              Criar primeiro projeto
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

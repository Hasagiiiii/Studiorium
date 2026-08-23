import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { ProjectTrash } from '../components/ProjectTrash.js';

export function ProjectsPage() {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [params, setParams] = useSearchParams();
  const me = data?.user;
  const projects = me ? (data?.projects.filter((item) => item.ownerId === me.id) ?? []) : [];
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

  return (
    <FeaturePage
      eyebrow="Projetos"
      title="Seu espaço de criação"
      description="Crie, edite e organize projetos sem misturar o workspace pessoal com a descoberta pública do Lorion."
    >
      {me ? (
        <>
          <section className="project-workspace-actions form-actions">
            <button className="button primary" type="button" onClick={() => setCreating(!creating)}>
              {creating ? 'Cancelar' : 'Novo projeto'}
            </button>
            <ProjectTrash />
          </section>

          {creating ? (
            <form className="auth-form project-create-form" onSubmit={submit}>
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
                  <option value="private">Privado</option>
                  <option value="public">Público</option>
                </select>
              </label>
              <label>
                Notas
                <textarea
                  maxLength={4000}
                  rows={5}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              {status === 'error' ? <p className="inline-error">{error}</p> : null}
              <button className="button primary" type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? 'Criando…' : 'Criar projeto'}
              </button>
            </form>
          ) : null}

          <section className="resource-section">
            <header>
              <div>
                <span className="eyebrow">Workspace</span>
                <h2>Meus projetos</h2>
              </div>
            </header>
            {projects.length ? (
              <div className="resource-grid">
                {projects.map((project) => (
                  <article key={project.id} className="resource-card project-card">
                    <span className="eyebrow">{project.type}</span>
                    <h3>
                      <Link to={`/projetos/${encodeURIComponent(project.id)}`}>
                        {project.title}
                      </Link>
                    </h3>
                    {project.notes ? <p>{project.notes}</p> : null}
                    <footer>
                      {project.visibility === 'public' ? 'Público' : 'Privado'} · {project.sections.length} seções
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Você ainda não criou projetos.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="empty-state">
          <h2>Entre para criar e organizar projetos</h2>
          <p>A descoberta de projetos públicos continua disponível em Explorar.</p>
          <Link className="button primary" to="/entrar">
            Entrar
          </Link>
        </section>
      )}
    </FeaturePage>
  );
}

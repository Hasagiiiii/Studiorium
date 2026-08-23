import { useEffect, useState } from 'react';
import type { Project } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

export function ProjectTrash() {
  const { reload } = useAppState();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await services.projects.trash();
      setProjects(result.projects);
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível carregar a lixeira.', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function restore(projectId: string) {
    if (busyId) return;
    setBusyId(projectId);
    try {
      await services.projects.restore(projectId);
      await Promise.all([load(), reload()]);
      pushToast({ message: 'Projeto restaurado.', tone: 'success' });
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível restaurar o projeto.', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  async function purge(projectId: string) {
    if (busyId) return;
    if (!window.confirm('Excluir este projeto definitivamente? Esta ação não pode ser desfeita.')) return;
    setBusyId(projectId);
    try {
      await services.projects.purge(projectId);
      await load();
      pushToast({ message: 'Projeto excluído definitivamente.', tone: 'success' });
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível excluir o projeto.', tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="project-trash">
      <button className="button secondary" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Fechar lixeira' : 'Abrir lixeira'}
      </button>
      {open ? (
        <div className="project-trash-list">
          <h2>Lixeira</h2>
          {loading ? <p>Carregando…</p> : null}
          {!loading && !projects.length ? <p>Nenhum projeto na lixeira.</p> : null}
          {projects.map((project) => (
            <article key={project.id} className="resource-card">
              <h3>{project.title}</h3>
              <div className="form-actions">
                <button className="button primary" type="button" disabled={Boolean(busyId)} onClick={() => void restore(project.id)}>
                  Restaurar
                </button>
                <button className="button danger" type="button" disabled={Boolean(busyId)} onClick={() => void purge(project.id)}>
                  Excluir definitivamente
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

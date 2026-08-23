import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectSection } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  project: Project;
  onUpdated(project: Project): void;
};

export function ProjectEditor({ project, onUpdated }: Props) {
  const navigate = useNavigate();
  const { reload } = useAppState();
  const { pushToast } = useToast();
  const [title, setTitle] = useState(project.title);
  const [notes, setNotes] = useState(project.notes);
  const [visibility, setVisibility] = useState<'private' | 'public'>(project.visibility);
  const [sections, setSections] = useState<ProjectSection[]>(project.sections);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(project.title);
    setNotes(project.notes);
    setVisibility(project.visibility);
    setSections(project.sections);
  }, [project]);

  function updateSection(index: number, patch: Partial<ProjectSection>) {
    setSections((current) => current.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function addSection() {
    if (sections.length >= 20) return;
    setSections((current) => [...current, { name: `Seção ${current.length + 1}`, content: '' }]);
  }

  function removeSection(index: number) {
    setSections((current) => current.filter((_, i) => i !== index));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const updated = await services.projects.update(project.id, {
        title: title.trim(),
        notes,
        visibility,
        sections: sections.map((section) => ({
          name: section.name.trim() || 'Seção',
          content: section.content,
        })),
      });
      onUpdated(updated);
      await reload();
      pushToast({ message: 'Projeto salvo.', tone: 'success' });
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível salvar o projeto.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function moveToTrash() {
    if (deleting) return;
    if (!window.confirm('Mover este projeto para a lixeira? Você poderá restaurá-lo depois.')) return;
    setDeleting(true);
    try {
      await services.projects.delete(project.id);
      await reload();
      pushToast({ message: 'Projeto movido para a lixeira.', tone: 'success' });
      navigate('/projetos');
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível mover o projeto para a lixeira.',
        tone: 'error',
      });
      setDeleting(false);
    }
  }

  return (
    <form className="project-editor" onSubmit={save}>
      <section className="project-editor-settings">
        <label>
          Título
          <input required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Visibilidade
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as 'private' | 'public')}>
            <option value="private">Privado</option>
            <option value="public">Público</option>
          </select>
        </label>
        <label>
          Notas do projeto
          <textarea rows={5} maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </section>

      <section className="project-sections" aria-labelledby="project-sections-title">
        <header className="section-heading-row">
          <div>
            <span className="eyebrow">Documento</span>
            <h2 id="project-sections-title">Seções</h2>
          </div>
          <button className="button secondary" type="button" disabled={sections.length >= 20} onClick={addSection}>
            Adicionar seção
          </button>
        </header>

        {sections.map((section, index) => (
          <article key={`${index}-${section.name}`} className="project-section-editor">
            <div className="project-section-title-row">
              <input
                aria-label={`Nome da seção ${index + 1}`}
                maxLength={80}
                value={section.name}
                onChange={(event) => updateSection(index, { name: event.target.value })}
              />
              <button className="inline-action danger" type="button" onClick={() => removeSection(index)}>
                Remover
              </button>
            </div>
            <textarea
              aria-label={`Conteúdo da seção ${section.name || index + 1}`}
              rows={10}
              maxLength={30000}
              value={section.content}
              onChange={(event) => updateSection(index, { content: event.target.value })}
            />
          </article>
        ))}
      </section>

      <div className="form-actions project-editor-footer">
        <button className="button primary" type="submit" disabled={saving || deleting}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
        <button className="button danger" type="button" disabled={saving || deleting} onClick={() => void moveToTrash()}>
          {deleting ? 'Movendo…' : 'Mover para lixeira'}
        </button>
      </div>
    </form>
  );
}

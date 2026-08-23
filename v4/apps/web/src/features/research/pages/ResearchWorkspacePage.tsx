import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Publication, ResearchDraftInput, ResearchWorkspace } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

const EMPTY_DRAFT: ResearchDraftInput = {
  title: '',
  abstract: '',
  content: '',
  area: 'Geral',
  level: 'Não informado',
  keywords: [],
  license: 'Todos os direitos reservados',
};

type LoadState =
  | { status: 'loading'; value: ResearchWorkspace | null; error: null }
  | { status: 'ready'; value: ResearchWorkspace; error: null }
  | { status: 'error'; value: ResearchWorkspace | null; error: string };

function toDraft(publication: Publication): ResearchDraftInput {
  return {
    title: publication.title,
    abstract: publication.abstract,
    content: publication.content,
    area: publication.area,
    level: publication.level,
    keywords: publication.keywords,
    license: publication.license,
  };
}

export function ResearchWorkspacePage() {
  const { pushToast } = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading', value: null, error: null });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResearchDraftInput>(EMPTY_DRAFT);
  const [keywordText, setKeywordText] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setState((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      setState({ status: 'ready', value: await services.research.workspace(), error: null });
    } catch (cause) {
      setState((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar suas pesquisas.',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => state.value?.publications.find((item) => item.id === selectedId) || null,
    [selectedId, state.value],
  );

  function startNew() {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setKeywordText('');
  }

  function edit(publication: Publication) {
    setSelectedId(publication.id);
    setDraft(toDraft(publication));
    setKeywordText(publication.keywords.join(', '));
  }

  function normalizedDraft(): ResearchDraftInput {
    return {
      ...draft,
      keywords: keywordText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 10),
    };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy('save');
    try {
      const saved = selectedId
        ? await services.research.update(selectedId, normalizedDraft())
        : await services.research.create(normalizedDraft());
      setSelectedId(saved.id);
      setDraft(toDraft(saved));
      setKeywordText(saved.keywords.join(', '));
      pushToast({ message: 'Rascunho salvo.', tone: 'success' });
      await load();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível salvar a pesquisa.',
        tone: 'error',
      });
    } finally {
      setBusy('');
    }
  }

  async function perform(key: string, action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(key);
    try {
      await action();
      pushToast({ message: success, tone: 'success' });
      if (key.startsWith('delete:')) startNew();
      await load();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível concluir a ação.',
        tone: 'error',
      });
    } finally {
      setBusy('');
    }
  }

  if (state.status === 'loading' && !state.value) {
    return <FeaturePage eyebrow="Pesquisa" title="Carregando workspace…" description="Buscando seus trabalhos." />;
  }
  if (state.status === 'error' && !state.value) {
    return (
      <FeaturePage eyebrow="Pesquisa" title="Workspace indisponível" description={state.error || 'Entre para continuar.'}>
        <button className="button secondary" type="button" onClick={() => void load()}>Tentar novamente</button>
      </FeaturePage>
    );
  }
  if (!state.value) return null;

  return (
    <FeaturePage
      eyebrow="Pesquisa autoral"
      title="Escrita, revisão e publicação"
      description="Salve rascunhos privados e envie trabalhos completos para análise antes de aparecerem publicamente no Lorion."
    >
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div className="form-actions">
            <button className="button primary" type="button" onClick={startNew}>Nova pesquisa</button>
          </div>
          <h2>Meus trabalhos</h2>
          {state.value.publications.length ? (
            <div className="workspace-list">
              {state.value.publications.map((publication) => (
                <button
                  key={publication.id}
                  className={publication.id === selectedId ? 'workspace-list-item active' : 'workspace-list-item'}
                  type="button"
                  onClick={() => edit(publication)}
                >
                  <strong>{publication.title}</strong>
                  <span>{publication.status}</span>
                </button>
              ))}
            </div>
          ) : <p className="feed-status">Nenhuma pesquisa criada.</p>}
        </aside>

        <section className="workspace-editor">
          <form className="auth-form" onSubmit={save}>
            <label>
              Título
              <input
                required
                minLength={2}
                maxLength={180}
                value={draft.title}
                disabled={selected?.status === 'pending_review'}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              Resumo
              <textarea
                rows={7}
                maxLength={5000}
                value={draft.abstract}
                disabled={selected?.status === 'pending_review'}
                onChange={(event) => setDraft((current) => ({ ...current, abstract: event.target.value }))}
              />
            </label>
            <label>
              Conteúdo
              <textarea
                rows={18}
                maxLength={60000}
                value={draft.content}
                disabled={selected?.status === 'pending_review'}
                onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              />
            </label>
            <div className="form-grid">
              <label>
                Área
                <input
                  maxLength={80}
                  value={draft.area}
                  disabled={selected?.status === 'pending_review'}
                  onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
                />
              </label>
              <label>
                Nível
                <input
                  maxLength={80}
                  value={draft.level}
                  disabled={selected?.status === 'pending_review'}
                  onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Palavras-chave, separadas por vírgula
              <input
                maxLength={650}
                value={keywordText}
                disabled={selected?.status === 'pending_review'}
                onChange={(event) => setKeywordText(event.target.value)}
              />
            </label>
            <label>
              Licença
              <input
                maxLength={80}
                value={draft.license}
                disabled={selected?.status === 'pending_review'}
                onChange={(event) => setDraft((current) => ({ ...current, license: event.target.value }))}
              />
            </label>

            {selected?.moderationNote ? (
              <div className="inline-feedback">
                <strong>Nota da revisão</strong>
                <p>{selected.moderationNote}</p>
              </div>
            ) : null}

            <div className="form-actions">
              <button className="button primary" type="submit" disabled={Boolean(busy) || selected?.status === 'pending_review'}>
                {busy === 'save' ? 'Salvando…' : selectedId ? 'Salvar alterações' : 'Criar rascunho'}
              </button>
              {selected && ['draft', 'rejected'].includes(selected.status) ? (
                <button
                  className="button secondary"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void perform(
                      `submit:${selected.id}`,
                      () => services.research.submit(selected.id),
                      'Pesquisa enviada para revisão.',
                    )
                  }
                >
                  Enviar para revisão
                </button>
              ) : null}
              {selected?.status === 'published' ? (
                <Link className="button secondary" to={`/pesquisas/${encodeURIComponent(selected.slug)}`}>
                  Ver publicação
                </Link>
              ) : null}
              {selected && selected.status !== 'pending_review' ? (
                <button
                  className="inline-action danger"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (!window.confirm('Mover esta pesquisa para a lixeira?')) return;
                    void perform(
                      `delete:${selected.id}`,
                      () => services.research.remove(selected.id),
                      'Pesquisa movida para a lixeira.',
                    );
                  }}
                >
                  Mover para lixeira
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <section className="resource-section">
        <header><h2>Lixeira</h2></header>
        {state.value.trash.length ? (
          <div className="resource-grid">
            {state.value.trash.map((publication) => (
              <article key={publication.id} className="resource-card">
                <h3>{publication.title}</h3>
                <div className="form-actions">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(`restore:${publication.id}`, () => services.research.restore(publication.id), 'Pesquisa restaurada.')}
                  >
                    Restaurar
                  </button>
                  <button
                    className="inline-action danger"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      if (!window.confirm('Excluir esta pesquisa definitivamente? Essa ação não pode ser desfeita.')) return;
                      void perform(`purge:${publication.id}`, () => services.research.purge(publication.id), 'Pesquisa excluída definitivamente.');
                    }}
                  >
                    Excluir definitivamente
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><p>A lixeira está vazia.</p></div>}
      </section>
    </FeaturePage>
  );
}

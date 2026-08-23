import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type {
  ApplyNewsContributorInput,
  NewsArticle,
  NewsDraftInput,
  NewsWorkspace,
} from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

const EMPTY_DRAFT: NewsDraftInput = {
  title: '',
  summary: '',
  body: '',
  category: 'Atualizações',
  sources: [],
};

const EMPTY_APPLICATION: ApplyNewsContributorInput = {
  area: '',
  institution: '',
  portfolioUrl: '',
  statement: '',
};

type LoadState =
  | { status: 'loading'; value: NewsWorkspace | null; error: null }
  | { status: 'ready'; value: NewsWorkspace; error: null }
  | { status: 'error'; value: NewsWorkspace | null; error: string };

function toDraft(article: NewsArticle): NewsDraftInput {
  return {
    title: article.title,
    summary: article.summary,
    body: article.body,
    category: article.category,
    sources: article.sources,
  };
}

function sourceLines(article: NewsDraftInput): string {
  return article.sources.map((source) => `${source.title} | ${source.url}`).join('\n');
}

function parseSourceLines(value: string): NewsDraftInput['sources'] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .flatMap((line) => {
      const separator = line.indexOf('|');
      if (separator < 0) return [];
      const title = line.slice(0, separator).trim();
      const url = line.slice(separator + 1).trim();
      if (!title || !url) return [];
      return [{ title, url }];
    });
}

export function NewsWorkspacePage() {
  const { pushToast } = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading', value: null, error: null });
  const [application, setApplication] = useState<ApplyNewsContributorInput>(EMPTY_APPLICATION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsDraftInput>(EMPTY_DRAFT);
  const [sourcesText, setSourcesText] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setState((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      const value = await services.news.workspace();
      setState({ status: 'ready', value, error: null });
      if (value.contributor) {
        setApplication({
          area: value.contributor.area,
          institution: value.contributor.institution,
          portfolioUrl: value.contributor.portfolioUrl,
          statement: value.contributor.statement,
        });
      }
    } catch (cause) {
      setState((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar o workspace editorial.',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => state.value?.articles.find((item) => item.id === selectedId) || null,
    [selectedId, state.value],
  );

  function startNew() {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setSourcesText('');
  }

  function edit(article: NewsArticle) {
    setSelectedId(article.id);
    setDraft(toDraft(article));
    setSourcesText(sourceLines(toDraft(article)));
  }

  function normalizedDraft(): NewsDraftInput {
    return { ...draft, sources: parseSourceLines(sourcesText) };
  }

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy('apply');
    try {
      await services.news.applyContributor(application);
      pushToast({ message: 'Credenciamento enviado para análise editorial.', tone: 'success' });
      await load();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível enviar o credenciamento.',
        tone: 'error',
      });
    } finally {
      setBusy('');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy('save');
    try {
      const saved = selectedId
        ? await services.news.update(selectedId, normalizedDraft())
        : await services.news.create(normalizedDraft());
      setSelectedId(saved.id);
      setDraft(toDraft(saved));
      setSourcesText(sourceLines(toDraft(saved)));
      pushToast({ message: 'Rascunho editorial salvo.', tone: 'success' });
      await load();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível salvar a notícia.',
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
      if (key.startsWith('delete:')) startNew();
      pushToast({ message: success, tone: 'success' });
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
    return <FeaturePage eyebrow="Notícias" title="Carregando workspace…" description="Validando credenciamento editorial." />;
  }
  if (state.status === 'error' && !state.value) {
    return (
      <FeaturePage eyebrow="Notícias" title="Workspace indisponível" description={state.error || 'Entre para continuar.'}>
        <button className="button secondary" type="button" onClick={() => void load()}>Tentar novamente</button>
      </FeaturePage>
    );
  }
  if (!state.value) return null;

  if (!state.value.canWrite) {
    const contributor = state.value.contributor;
    return (
      <FeaturePage
        eyebrow="Canal oficial"
        title="Credenciamento editorial"
        description="Publicar notícias é uma permissão separada de profissão declarada ou selo profissional."
      >
        {contributor?.status === 'pending' ? (
          <div className="inline-feedback">
            <h2>Solicitação em análise</h2>
            <p>A equipe editorial ainda está avaliando seu credenciamento.</p>
          </div>
        ) : null}
        {contributor?.status === 'rejected' && contributor.reviewNote ? (
          <div className="inline-feedback">
            <h2>Revisão anterior</h2>
            <p>{contributor.reviewNote}</p>
          </div>
        ) : null}
        <form className="auth-form" onSubmit={apply}>
          <label>
            Área de atuação editorial
            <input required minLength={3} maxLength={120} value={application.area} onChange={(event) => setApplication((current) => ({ ...current, area: event.target.value }))} />
          </label>
          <label>
            Instituição
            <input maxLength={180} value={application.institution} onChange={(event) => setApplication((current) => ({ ...current, institution: event.target.value }))} />
          </label>
          <label>
            Portfólio ou página profissional
            <input type="url" maxLength={1000} value={application.portfolioUrl} onChange={(event) => setApplication((current) => ({ ...current, portfolioUrl: event.target.value }))} />
          </label>
          <label>
            Experiência e propósito
            <textarea required minLength={40} maxLength={2000} rows={7} value={application.statement} onChange={(event) => setApplication((current) => ({ ...current, statement: event.target.value }))} />
          </label>
          <button className="button primary" type="submit" disabled={Boolean(busy)}>
            {busy === 'apply' ? 'Enviando…' : contributor ? 'Reenviar credenciamento' : 'Solicitar credenciamento'}
          </button>
        </form>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow="Notícias oficiais"
      title="Workspace editorial"
      description="Escreva rascunhos, documente fontes e envie para certificação humana antes da publicação."
    >
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <button className="button primary" type="button" onClick={startNew}>Nova notícia</button>
          <h2>Minhas matérias</h2>
          {state.value.articles.length ? (
            <div className="workspace-list">
              {state.value.articles.map((article) => (
                <button
                  key={article.id}
                  className={article.id === selectedId ? 'workspace-list-item active' : 'workspace-list-item'}
                  type="button"
                  onClick={() => edit(article)}
                >
                  <strong>{article.title}</strong>
                  <span>{article.status}</span>
                </button>
              ))}
            </div>
          ) : <p className="feed-status">Nenhuma notícia criada.</p>}
        </aside>

        <section className="workspace-editor">
          <form className="auth-form" onSubmit={save}>
            <label>
              Título
              <input required minLength={2} maxLength={180} value={draft.title} disabled={selected?.status === 'editorial_review'} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              Resumo
              <textarea rows={5} maxLength={1000} value={draft.summary} disabled={selected?.status === 'editorial_review'} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
            </label>
            <label>
              Texto
              <textarea rows={18} maxLength={60000} value={draft.body} disabled={selected?.status === 'editorial_review'} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} />
            </label>
            <label>
              Categoria
              <input maxLength={80} value={draft.category} disabled={selected?.status === 'editorial_review'} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label>
              Fontes — uma por linha no formato “Título | https://endereco”
              <textarea rows={7} value={sourcesText} disabled={selected?.status === 'editorial_review'} onChange={(event) => setSourcesText(event.target.value)} />
            </label>

            {selected?.editorialNote ? (
              <div className="inline-feedback">
                <strong>Nota editorial</strong>
                <p>{selected.editorialNote}</p>
              </div>
            ) : null}
            {selected?.aiReviewStatus === 'flagged' ? (
              <div className="inline-feedback">
                <strong>Triagem automática</strong>
                <p>A matéria possui pontos sinalizados para atenção da revisão humana.</p>
              </div>
            ) : null}

            <div className="form-actions">
              <button className="button primary" type="submit" disabled={Boolean(busy) || selected?.status === 'editorial_review'}>
                {busy === 'save' ? 'Salvando…' : selectedId ? 'Salvar alterações' : 'Criar rascunho'}
              </button>
              {selected && ['draft', 'changes_requested'].includes(selected.status) ? (
                <button
                  className="button secondary"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void perform(`submit:${selected.id}`, () => services.news.submit(selected.id), 'Notícia enviada para certificação editorial.')}
                >
                  Enviar para revisão
                </button>
              ) : null}
              {selected?.status === 'published' ? (
                <Link className="button secondary" to={`/noticias/${encodeURIComponent(selected.slug)}`}>Ver publicação</Link>
              ) : null}
              {selected && !['editorial_review', 'ai_review'].includes(selected.status) ? (
                <button
                  className="inline-action danger"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (!window.confirm('Mover esta notícia para a lixeira?')) return;
                    void perform(`delete:${selected.id}`, () => services.news.remove(selected.id), 'Notícia movida para a lixeira.');
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
            {state.value.trash.map((article) => (
              <article key={article.id} className="resource-card">
                <h3>{article.title}</h3>
                <div className="form-actions">
                  <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void perform(`restore:${article.id}`, () => services.news.restore(article.id), 'Notícia restaurada.')}>Restaurar</button>
                  <button
                    className="inline-action danger"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      if (!window.confirm('Excluir esta notícia definitivamente?')) return;
                      void perform(`purge:${article.id}`, () => services.news.purge(article.id), 'Notícia excluída definitivamente.');
                    }}
                  >
                    Excluir definitivamente
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><p>A lixeira editorial está vazia.</p></div>}
      </section>
    </FeaturePage>
  );
}

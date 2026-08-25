import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CommunityHub as CommunityHubData } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { SocialPostCard } from '../../posts/components/SocialPostCard.js';

type Props = { slug: string; canAccess: boolean };
type HubTab = 'all' | 'posts' | 'discussions';
type DiscussionSort = 'recent' | 'active';

function timestampValue(value: string | null): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function CommunityHub({ slug, canAccess }: Props) {
  const { pushToast } = useToast();
  const [hub, setHub] = useState<CommunityHubData | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Geral');
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<HubTab>('all');
  const [discussionSort, setDiscussionSort] = useState<DiscussionSort>('recent');
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    if (!canAccess) {
      setHub(null);
      setStatus('idle');
      setError('');
      return;
    }
    let active = true;
    setStatus('loading');
    setError('');
    void services.communities.hub(slug)
      .then((value) => {
        if (!active) return;
        setHub(value);
        setStatus('ready');
      })
      .catch((cause) => {
        if (!active) return;
        setStatus('error');
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a comunidade.');
      });
    return () => { active = false; };
  }, [canAccess, slug]);

  const activityCount = useMemo(() => (hub ? hub.posts.length + hub.discussions.length : 0), [hub]);
  const discussions = useMemo(() => {
    if (!hub) return [];
    const items = [...hub.discussions];
    if (discussionSort === 'active') {
      return items.sort((a, b) => b.replyCount - a.replyCount || timestampValue(b.createdAt) - timestampValue(a.createdAt));
    }
    return items.sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt));
  }, [hub, discussionSort]);

  if (!canAccess) return null;

  async function submitDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating || !hub?.canCreateDiscussion) return;
    setCreating(true);
    setError('');
    try {
      const discussion = await services.communities.createDiscussion(slug, {
        title: title.trim(),
        body: body.trim(),
        category: category.trim() || 'Geral',
      });
      setHub((current) => current ? { ...current, discussions: [discussion, ...current.discussions] } : current);
      setTitle('');
      setBody('');
      setCategory('Geral');
      setComposerOpen(false);
      setTab('discussions');
      pushToast({ message: 'Discussão publicada na comunidade.', tone: 'success' });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível publicar.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="community-hub">
      <div className="community-hub-toolbar">
        <div>
          <span className="eyebrow">Atividade</span>
          <h2>Conversas da comunidade</h2>
          {hub ? <p>{activityCount} itens recentes · {hub.members.length} membros ativos listados</p> : null}
        </div>
        {hub?.canCreateDiscussion ? (
          <button className="button primary" type="button" onClick={() => setComposerOpen((value) => !value)}>
            {composerOpen ? 'Fechar' : 'Nova discussão'}
          </button>
        ) : null}
      </div>

      <div className="community-feed-controls">
        <nav className="community-feed-tabs" aria-label="Filtrar atividade da comunidade">
          <button className={tab === 'all' ? 'active' : ''} type="button" onClick={() => setTab('all')}>Tudo</button>
          <button className={tab === 'posts' ? 'active' : ''} type="button" onClick={() => setTab('posts')}>Publicações</button>
          <button className={tab === 'discussions' ? 'active' : ''} type="button" onClick={() => setTab('discussions')}>Discussões</button>
        </nav>
        {(tab === 'all' || tab === 'discussions') && hub?.discussions.length ? (
          <div className="community-sort" aria-label="Ordenar discussões">
            <button className={discussionSort === 'recent' ? 'active' : ''} type="button" onClick={() => setDiscussionSort('recent')}>Novas</button>
            <button className={discussionSort === 'active' ? 'active' : ''} type="button" onClick={() => setDiscussionSort('active')}>Mais ativas</button>
          </div>
        ) : null}
      </div>

      {status === 'loading' ? <p className="feed-status">Carregando atividade…</p> : null}
      {status === 'error' ? <p className="inline-error" role="alert">{error}</p> : null}

      {hub ? (
        <div className="community-hub-layout">
          <main className="community-feed-column">
            {composerOpen && hub.canCreateDiscussion ? (
              <form className="community-discussion-composer" onSubmit={submitDiscussion}>
                <div><span className="eyebrow">Criar tópico</span><h3>Comece uma discussão</h3></div>
                <input required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título da discussão" aria-label="Título da discussão" />
                <textarea required minLength={1} maxLength={8000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Desenvolva sua ideia, pergunta ou proposta…" aria-label="Texto da discussão" />
                <div className="community-composer-footer">
                  <input maxLength={60} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Categoria" aria-label="Categoria" />
                  <button className="button primary" type="submit" disabled={creating}>{creating ? 'Publicando…' : 'Publicar discussão'}</button>
                </div>
              </form>
            ) : null}

            {(tab === 'all' || tab === 'posts') && hub.posts.length ? (
              <section className="community-feed-group" aria-label="Publicações">
                {hub.posts.map((post) => <SocialPostCard key={post.id} post={post} compact />)}
              </section>
            ) : null}

            {(tab === 'all' || tab === 'discussions') && discussions.length ? (
              <section className="community-feed-group" aria-label="Discussões">
                {discussions.map((discussion) => (
                  <article className="community-feed-item community-discussion-item" key={discussion.id}>
                    <div className="community-feed-type">{discussion.category || 'Discussão'}</div>
                    <div className="community-feed-author"><span>por {discussion.authorName}</span></div>
                    <h3><Link to={`/discussoes/${encodeURIComponent(discussion.id)}`}>{discussion.title}</Link></h3>
                    {discussion.body ? <p>{discussion.body}</p> : null}
                    <div className="community-feed-actions">
                      <Link to={`/discussoes/${encodeURIComponent(discussion.id)}`}>{discussion.replyCount} {discussion.replyCount === 1 ? 'resposta' : 'respostas'}</Link>
                      <span>·</span>
                      <Link to={`/discussoes/${encodeURIComponent(discussion.id)}`}>Entrar na conversa</Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {(tab === 'posts' && !hub.posts.length) || (tab === 'discussions' && !hub.discussions.length) || (tab === 'all' && !activityCount) ? (
              <div className="empty-state"><h3>Nada por aqui ainda.</h3><p>As próximas conversas da comunidade aparecerão neste feed.</p></div>
            ) : null}
          </main>

          <aside className="community-hub-sidebar" aria-label="Membros da comunidade">
            <section>
              <span className="eyebrow">Pessoas</span>
              <h3>Membros ativos</h3>
              {hub.members.length ? (
                <ul className="community-member-list">
                  {hub.members.slice(0, 8).map((member) => (
                    <li key={member.userId}>
                      <span className="community-member-avatar">{member.displayName.slice(0, 1).toUpperCase()}</span>
                      <div>{member.username ? <Link to={`/perfil/${encodeURIComponent(member.username)}`}>{member.displayName}</Link> : <strong>{member.displayName}</strong>}<small>{member.role}</small></div>
                    </li>
                  ))}
                </ul>
              ) : <p>Nenhum membro ativo listado.</p>}
            </section>
          </aside>
        </div>
      ) : null}

      {error && status !== 'error' ? <p className="inline-error" role="alert">{error}</p> : null}
    </section>
  );
}

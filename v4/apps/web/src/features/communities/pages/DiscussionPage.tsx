import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function DiscussionPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const discussion = data?.discussions.find((item) => item.id === id);

  if (!discussion) {
    return (
      <FeaturePage
        eyebrow="Discussão"
        title="Discussão não encontrada"
        description="O tópico pode ter sido removido, moderado ou ainda não estar disponível."
      >
        <Link to="/comunidades">Explorar comunidades</Link>
      </FeaturePage>
    );
  }

  const publishedAt = formatDate(discussion.createdAt);
  const updatedAt = formatDate(discussion.updatedAt);
  const wasEdited = Boolean(updatedAt && updatedAt !== publishedAt);

  return (
    <FeaturePage
      eyebrow={discussion.category}
      title={discussion.title}
      description="Conversa da comunidade"
    >
      <div className="discussion-page-layout">
        <main className="discussion-thread">
          <Link className="discussion-back-link" to="/comunidades">
            ← Voltar às comunidades
          </Link>

          <article className="discussion-topic-card">
            <header className="discussion-topic-header">
              <div className="discussion-author-avatar" aria-hidden="true">
                {discussion.authorName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{discussion.authorName}</strong>
                <div className="discussion-topic-meta">
                  {publishedAt ? <span>{publishedAt}</span> : null}
                  {wasEdited ? <span>Editado</span> : null}
                  <span>{discussion.category}</span>
                </div>
              </div>
            </header>

            <div className="discussion-topic-body">
              {discussion.body ? <p>{discussion.body}</p> : null}
            </div>

            <footer className="discussion-topic-footer">
              <span>Tópico aberto</span>
              <span>Status: {discussion.status}</span>
            </footer>
          </article>

          <section className="discussion-replies-placeholder" aria-labelledby="discussion-replies-title">
            <div>
              <span className="eyebrow">Conversa</span>
              <h2 id="discussion-replies-title">Respostas</h2>
            </div>
            <p>
              As respostas encadeadas ainda não fazem parte do contrato público desta discussão.
              Esta área fica preparada para receber a thread sem criar contadores ou mensagens falsas.
            </p>
          </section>
        </main>

        <aside className="discussion-context" aria-label="Contexto da discussão">
          <section>
            <span className="eyebrow">Sobre o tópico</span>
            <dl>
              <div><dt>Categoria</dt><dd>{discussion.category}</dd></div>
              <div><dt>Autor</dt><dd>{discussion.authorName}</dd></div>
              <div><dt>Status</dt><dd>{discussion.status}</dd></div>
            </dl>
          </section>
          <section>
            <h2>Próxima evolução</h2>
            <p>Thread em árvore, votos, contagem de respostas, ordenação e moderação por tópico.</p>
          </section>
        </aside>
      </div>
    </FeaturePage>
  );
}

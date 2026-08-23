import { useState } from 'react';
import type { AdminDashboard } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';

type Props = {
  dashboard: AdminDashboard;
  busy: string;
  perform(key: string, action: () => Promise<unknown>, success: string): Promise<void>;
};

export function AdminEditorialQueues({ dashboard, busy, perform }: Props) {
  const [researchNotes, setResearchNotes] = useState<Record<string, string>>({});
  const [contributorNotes, setContributorNotes] = useState<Record<string, string>>({});
  const [newsNotes, setNewsNotes] = useState<Record<string, string>>({});
  const [featuredNews, setFeaturedNews] = useState<Record<string, boolean>>({});

  return (
    <>
      <section className="resource-section admin-section">
        <header>
          <div>
            <span className="eyebrow">Pesquisa</span>
            <h2>Revisão de trabalhos</h2>
          </div>
        </header>
        {dashboard.researchReviewQueue.length ? (
          <div className="resource-grid admin-grid">
            {dashboard.researchReviewQueue.map((publication) => (
              <article key={publication.id} className="resource-card">
                <span className="eyebrow">{publication.area} · {publication.level}</span>
                <h3>{publication.title}</h3>
                <p><strong>{publication.authorName}</strong></p>
                <p>{publication.abstract}</p>
                {publication.content ? <details><summary>Ver conteúdo</summary><p>{publication.content}</p></details> : null}
                <label>
                  Nota da revisão
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={researchNotes[publication.id] || ''}
                    onChange={(event) => setResearchNotes((current) => ({ ...current, [publication.id]: event.target.value }))}
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="button primary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `research:${publication.id}:publish`,
                      () => services.admin.reviewResearch(publication.id, {
                        status: 'published',
                        note: researchNotes[publication.id] || '',
                        featured: false,
                      }),
                      'Pesquisa aprovada e publicada.',
                    )}
                  >
                    Aprovar
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `research:${publication.id}:reject`,
                      () => services.admin.reviewResearch(publication.id, {
                        status: 'rejected',
                        note: researchNotes[publication.id] || '',
                        featured: false,
                      }),
                      'Pesquisa devolvida ao autor.',
                    )}
                  >
                    Rejeitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><p>Não há pesquisas aguardando revisão.</p></div>}
      </section>

      <section className="resource-section admin-section">
        <header>
          <div>
            <span className="eyebrow">Canal oficial</span>
            <h2>Credenciamentos editoriais</h2>
          </div>
        </header>
        {dashboard.newsContributorApplications.length ? (
          <div className="resource-grid admin-grid">
            {dashboard.newsContributorApplications.map((application) => (
              <article key={application.userId} className="resource-card">
                <span className="eyebrow">{application.area}</span>
                <h3>{application.institution || 'Credenciamento individual'}</h3>
                <p>{application.statement}</p>
                {application.portfolioUrl ? (
                  <a href={application.portfolioUrl} target="_blank" rel="noreferrer noopener">Abrir portfólio</a>
                ) : null}
                <label>
                  Nota da análise
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={contributorNotes[application.userId] || ''}
                    onChange={(event) => setContributorNotes((current) => ({ ...current, [application.userId]: event.target.value }))}
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="button primary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `news-contributor:${application.userId}:approve`,
                      () => services.admin.reviewNewsContributor(application.userId, {
                        status: 'approved',
                        note: contributorNotes[application.userId] || '',
                      }),
                      'Credenciamento editorial aprovado.',
                    )}
                  >
                    Aprovar
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `news-contributor:${application.userId}:reject`,
                      () => services.admin.reviewNewsContributor(application.userId, {
                        status: 'rejected',
                        note: contributorNotes[application.userId] || '',
                      }),
                      'Credenciamento editorial rejeitado.',
                    )}
                  >
                    Rejeitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><p>Não há pedidos de credenciamento editorial pendentes.</p></div>}
      </section>

      <section className="resource-section admin-section">
        <header>
          <div>
            <span className="eyebrow">Certificação</span>
            <h2>Notícias em revisão editorial</h2>
          </div>
        </header>
        {dashboard.newsEditorialQueue.length ? (
          <div className="resource-grid admin-grid">
            {dashboard.newsEditorialQueue.map((article) => (
              <article key={article.id} className="resource-card">
                <span className="eyebrow">{article.category} · triagem {article.aiReviewStatus}</span>
                <h3>{article.title}</h3>
                <p><strong>{article.authorName}</strong></p>
                <p>{article.summary}</p>
                <details>
                  <summary>Texto e fontes</summary>
                  <p>{article.body}</p>
                  <ul>
                    {article.sources.map((source) => (
                      <li key={`${article.id}:${source.url}`}>
                        <a href={source.url} target="_blank" rel="noreferrer noopener">{source.title}</a>
                      </li>
                    ))}
                  </ul>
                </details>
                <label>
                  Nota editorial
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={newsNotes[article.id] || ''}
                    onChange={(event) => setNewsNotes((current) => ({ ...current, [article.id]: event.target.value }))}
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={featuredNews[article.id] || false}
                    onChange={(event) => setFeaturedNews((current) => ({ ...current, [article.id]: event.target.checked }))}
                  />
                  Destacar quando publicar
                </label>
                <div className="form-actions">
                  <button
                    className="button primary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `news:${article.id}:publish`,
                      () => services.admin.reviewNewsArticle(article.id, {
                        status: 'published',
                        note: newsNotes[article.id] || '',
                        featured: featuredNews[article.id] || false,
                      }),
                      'Notícia certificada e publicada.',
                    )}
                  >
                    Certificar e publicar
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `news:${article.id}:changes`,
                      () => services.admin.reviewNewsArticle(article.id, {
                        status: 'changes_requested',
                        note: newsNotes[article.id] || '',
                        featured: false,
                      }),
                      'Alterações solicitadas ao autor.',
                    )}
                  >
                    Pedir alterações
                  </button>
                  <button
                    className="inline-action danger"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void perform(
                      `news:${article.id}:reject`,
                      () => services.admin.reviewNewsArticle(article.id, {
                        status: 'rejected',
                        note: newsNotes[article.id] || '',
                        featured: false,
                      }),
                      'Notícia rejeitada.',
                    )}
                  >
                    Rejeitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><p>Não há notícias aguardando certificação.</p></div>}
      </section>
    </>
  );
}

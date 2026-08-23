import { state, api, E, date, html } from '../runtime.js';
import { link, layout, empty, notFound } from './core.js';

async function thread(id) {
  let data;
  try {
    data = await api('/api/discussions/' + encodeURIComponent(id) + '/replies');
  } catch {
    return notFound();
  }
  const d = data.discussion;
  const replyMap = data.replyMap || {
    total: data.replies.length,
    questionCount: 0,
    clusters: [],
  };
  const clusterFilters = replyMap.clusters
    .map(
      (cluster) =>
        html`<button
          class="comment-filter"
          type="button"
          data-comment-filter="${E(cluster.id)}"
          aria-pressed="false"
          title="${E(cluster.representativeQuestion)}"
        >
          <span>${E(cluster.label)}</span><strong>${cluster.count}</strong>
        </button>`,
    )
    .join('');
  const replies = data.replies
    .map((reply, index) => {
      const insight = reply.insight || {};
      return html`<article
        class="reply"
        data-comment-item
        data-comment-index="${index}"
        data-comment-created="${new Date(reply.createdAt).getTime() || 0}"
        data-comment-question="${insight.questionLike ? 'true' : 'false'}"
        data-comment-cluster="${E(insight.clusterId || '')}"
        data-comment-similar="${Number(insight.similarCount) || 0}"
      >
        <header class="reply-head">
          <div>
            <strong>${E(reply.authorName)}</strong>
            <span class="muted small">· ${date(reply.createdAt)}</span>
          </div>
          <div class="reply-signals">
            ${insight.questionLike
              ? html`<span class="reply-signal question">Dúvida identificada</span>`
              : ''}
            ${insight.similarCount
              ? html`<button
                  type="button"
                  class="reply-signal related"
                  data-comment-filter="${E(insight.clusterId)}"
                  aria-label="Mostrar dúvidas semelhantes sobre ${E(insight.clusterLabel)}"
                >
                  ${insight.similarCount} semelhante${insight.similarCount === 1 ? '' : 's'}
                </button>`
              : ''}
          </div>
        </header>
        <p>${E(reply.body)}</p>
        <footer class="reply-actions">
          ${insight.clusterLabel
            ? html`<span class="reply-topic">Núcleo: ${E(insight.clusterLabel)}</span>`
            : '<span></span>'}
          <button class="linkbtn report-link" data-report="reply:${E(reply.id)}">Denunciar</button>
        </footer>
      </article>`;
    })
    .join('');
  const related = (data.relatedDiscussions || [])
    .map(
      (discussion) =>
        html`<a
          class="related-discussion"
          href="/coloquio/${encodeURIComponent(discussion.id)}"
          data-link
        >
          <span>${E(discussion.category)}</span>
          <strong>${E(discussion.title)}</strong>
          <small>Explorar conversa relacionada →</small>
        </a>`,
    )
    .join('');
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="crumbs">${link('/comunidades', 'Comunidades')} / ${E(d.category)}</div>
        <article class="threadpost">
          <div class="eyebrow">${E(d.category)}</div>
          <h1>${E(d.title)}</h1>
          <div class="meta">
            <span>por ${E(d.authorName)}</span><span>${date(d.createdAt)}</span>
          </div>
          <div class="rule"></div>
          <p style="white-space: pre-wrap; line-height: 1.8; color: #c7bdab">${E(d.body)}</p>
          <button class="outline" data-report="discussion:${E(d.id)}">Denunciar</button>
        </article>
        <div class="section compact" data-comment-map data-comment-map-filter="all">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Conversa organizada</div>
              <h2>${data.replies.length} contribuiç${data.replies.length === 1 ? 'ão' : 'ões'}</h2>
            </div>
            <p class="comment-map-intro">
              O mapa se refaz a partir do texto real da conversa. Nenhum tema é pré-cadastrado.
            </p>
          </div>
          <section class="comment-map" aria-labelledby="commentMapTitle">
            <div class="comment-map-head">
              <div>
                <div class="eyebrow">Filtro vivo</div>
                <h3 id="commentMapTitle">Mapa das dúvidas desta conversa</h3>
              </div>
              <div class="comment-map-metrics" aria-label="Resumo da análise">
                <span><strong>${replyMap.questionCount}</strong> perguntas</span>
                <span><strong>${replyMap.clusters.length}</strong> núcleos recorrentes</span>
              </div>
            </div>
            <p class="comment-map-copy">
              O Studiorium compara vocabulário, contexto e formato de pergunta para aproximar
              comentários com a mesma dúvida. Os rótulos abaixo nascem das palavras usadas aqui e
              são atualizados a cada nova resposta.
            </p>
            <div class="comment-filters" role="group" aria-label="Filtrar comentários por tema">
              <button
                class="comment-filter active"
                type="button"
                data-comment-filter="all"
                aria-pressed="true"
              >
                <span>Todas as contribuições</span><strong>${replyMap.total}</strong>
              </button>
              ${replyMap.questionCount
                ? html`<button
                    class="comment-filter"
                    type="button"
                    data-comment-filter="questions"
                    aria-pressed="false"
                  >
                    <span>Somente dúvidas</span><strong>${replyMap.questionCount}</strong>
                  </button>`
                : ''}
              ${clusterFilters}
            </div>
            ${replyMap.clusters.length
              ? ''
              : html`<div class="comment-map-waiting">
                  Os primeiros núcleos aparecerão quando duas contribuições trouxerem dúvidas
                  realmente próximas.
                </div>`}
            <div class="comment-tools">
              <label class="comment-search">
                <span>Buscar nesta conversa</span>
                <input
                  class="field"
                  type="search"
                  data-comment-search
                  placeholder="Digite uma palavra ou expressão"
                />
              </label>
              <label>
                <span>Ordenar comentários</span>
                <select class="select" data-comment-order>
                  <option value="relevance">Mais relacionados</option>
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="questions">Dúvidas primeiro</option>
                </select>
              </label>
            </div>
            <div class="comment-result-line" aria-live="polite">
              <span data-comment-count>${replyMap.total}</span> comentário(s) visível(is)
            </div>
          </section>
          <div data-comment-list>${replies || empty('Ainda não há respostas.')}</div>
          <div class="empty comment-filter-empty" data-comment-empty hidden>
            Nenhum comentário corresponde a este recorte. Troque o filtro ou a busca.
          </div>
          ${related
            ? html`<aside class="related-discussions-panel">
                <div class="eyebrow">Conexões do acervo</div>
                <h3>Outras conversas que usam ideias próximas</h3>
                <div class="related-discussions-grid">${related}</div>
              </aside>`
            : ''}
          <div class="card reply-composer">
            <h3>Responder ao colóquio</h3>
            ${state.me
              ? html`<form data-reply="${E(d.id)}">
                  <textarea
                    class="textarea"
                    name="body"
                    placeholder="Contribua com argumento, pergunta ou referência…"
                    minlength="2"
                    maxlength="6000"
                    data-reply-body
                    required
                  ></textarea>
                  <div class="reply-quality" data-reply-quality aria-live="polite">
                    <span data-quality-context>Contexto</span>
                    <span data-quality-question>Pergunta clara</span>
                    <span data-quality-reference>Fonte ou exemplo</span>
                  </div>
                  <p class="small muted reply-guidance">
                    Diga o que você já tentou e formule uma pergunta específica. Isso ajuda o mapa
                    vivo a aproximar sua dúvida de respostas úteis sem expor dados pessoais.
                  </p>
                  <div class="actions reply-submit-actions">
                    <button class="solid">Publicar resposta</button>
                  </div>
                </form>`
              : html`<p>Entre em sua conta para responder.</p>
                  ${link('/login', 'Entrar', 'outline')}`}
          </div>
        </div>
      </div>
    </section>`,
  );
}

function login() {
  layout(
    html`<div class="authwrap">
      <form class="authcard" data-login>
        <div class="eyebrow">Accessus</div>
        <h1>Entrar no Studiorium</h1>
        <p>Acesse sua escrivaninha, projetos, publicações e discussões.</p>
        <div class="formrow">
          <label class="label">E-mail</label
          ><input class="field" type="email" name="email" required autocomplete="email" />
        </div>
        <div class="formrow">
          <label class="label">Senha</label
          ><input
            class="field"
            type="password"
            name="password"
            minlength="8"
            required
            autocomplete="current-password"
          />
        </div>
        <button class="solid" style="width:100%">Entrar</button>
        <p class="small">${link('/recuperar-senha', 'Esqueci minha senha')}</p>
        <p class="small">Ainda não tem conta? ${link('/cadastro', 'Criar conta.')}</p>
      </form>
    </div>`,
    { noFooter: true },
  );
}

function requestPasswordReset() {
  layout(
    html`<div class="authwrap">
      <form class="authcard" data-password-reset-request>
        <div class="eyebrow">Recuperatio</div>
        <h1>Recuperar acesso</h1>
        <p>
          Informe o e-mail da conta. Se ele estiver cadastrado, enviaremos um link válido por 30
          minutos.
        </p>
        <div class="formrow">
          <label class="label">E-mail</label>
          <input class="field" type="email" name="email" required autocomplete="email" />
        </div>
        <button class="solid full-button">Enviar link seguro</button>
        <p class="small">${link('/login', 'Voltar ao login')}</p>
      </form>
    </div>`,
    { noFooter: true },
  );
}

function resetPassword() {
  const rawToken = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  const hasValidToken = /^[a-f0-9]{64}$/.test(rawToken);

  layout(
    html`<div class="authwrap">
      <div class="authcard">
        <div class="eyebrow">Securitas</div>
        <h1>Redefinir senha</h1>
        ${hasValidToken
          ? html`<p>Crie uma nova senha para a conta administradora.</p>
              <form data-password-reset>
                <div class="formrow">
                  <label class="label">Nova senha</label>
                  <input
                    class="field"
                    type="password"
                    name="newPassword"
                    minlength="12"
                    maxlength="128"
                    required
                    autocomplete="new-password"
                  />
                </div>
                <div class="formrow">
                  <label class="label">Confirmar nova senha</label>
                  <input
                    class="field"
                    type="password"
                    name="confirmPassword"
                    minlength="12"
                    maxlength="128"
                    required
                    autocomplete="new-password"
                  />
                </div>
                <button class="solid" style="width:100%">Salvar nova senha</button>
              </form>`
          : html`<p>Este link é inválido ou está incompleto.</p>
              ${link('/login', 'Voltar ao login', 'outline')}`}
      </div>
    </div>`,
    { noFooter: true },
  );
}

function cadastro() {
  const open = state.boot?.settings?.registrations_open !== false;
  if (!open) {
    layout(
      html`<div class="authwrap">
        <div class="authcard">
          <div class="eyebrow">Admissio</div>
          <h1>Cadastros pausados</h1>
          <p>Novas contas estão temporariamente desativadas pela administração do Studiorium.</p>
          ${link('/', 'Voltar ao início', 'outline')}
        </div>
      </div>`,
      { noFooter: true },
    );
    return;
  }
  layout(
    html`<div class="authwrap">
      <form class="authcard" data-register>
        <div class="eyebrow">Admissio</div>
        <h1>Criar conta</h1>
        <p>
          Perfis de menores de idade começam privados por padrão e toda publicação passa pelas
          mesmas regras de segurança da comunidade.
        </p>
        <div class="formrow">
          <label class="label">Nome de exibição</label
          ><input class="field" name="displayName" required minlength="2" />
        </div>
        <div class="formgrid">
          <div>
            <label class="label">Ano de nascimento</label
            ><input
              class="field"
              name="birthYear"
              type="number"
              min="1930"
              max="${new Date().getFullYear()}"
              required
            />
          </div>
          <div>
            <label class="label">E-mail</label
            ><input class="field" name="email" type="email" required autocomplete="email" />
          </div>
        </div>
        <div class="formrow" style="margin-top:16px">
          <label class="label">Senha</label
          ><input
            class="field"
            name="password"
            type="password"
            minlength="8"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="notice">
          Ao criar a conta, você concorda em não publicar conteúdo discriminatório, assédio,
          exploração de menores, dados pessoais indevidos, plágio ou material ilegal.
        </div>
        <button class="solid" style="width:100%;margin-top:16px">Criar minha conta</button>
        <p class="small">Já tem conta? ${link('/login', 'Entrar.')}</p>
      </form>
    </div>`,
    { noFooter: true },
  );
}

export { thread, login, requestPasswordReset, resetPassword, cadastro };

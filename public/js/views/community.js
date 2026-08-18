import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

function coloquio() {
  let q = state.query.get('q') || '';
  let cat = state.query.get('categoria') || '';
  const cats = [...new Set(state.boot.discussions.map((d) => d.category))];
  let list = state.boot.discussions.filter(
    (d) =>
      (!q || JSON.stringify(d).toLowerCase().includes(q.toLowerCase())) &&
      (!cat || d.category === cat),
  );
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Colloquium</div>
        <h1 class="pagetitle">Colóquio</h1>
        <p>
          Discussões públicas sobre estudos, ciência, projetos e vida acadêmica. Conteúdo de ódio,
          racismo, xenofobia, sexismo, assédio, exploração de menores e exposição de dados pessoais
          é proibido.
        </p>
        <form class="toolbar" data-discussion-filter>
          <input class="field" name="q" value="${E(q)}" placeholder="Pesquisar discussões" /><select
            class="select"
            name="categoria"
          >
            <option value="">Todas as áreas</option>
            ${cats
              .map((c) => html`<option ${c === cat ? 'selected' : ''}>${E(c)}</option>`)
              .join('')}</select
          ><button class="solid">Filtrar</button
          ><button type="button" class="outline" data-new-discussion>Nova discussão</button>
        </form>
        <div>${list.map(discussionRow).join('') || empty('Nenhuma discussão encontrada.')}</div>
        <div id="discussionComposer"></div>
      </div>
    </section>`,
  );
}

async function thread(id) {
  let data;
  try {
    data = await api('/api/discussions/' + encodeURIComponent(id) + '/replies');
  } catch (e) {
    return notFound();
  }
  const d = data.discussion;
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="crumbs">${link('/coloquio', 'Colóquio')} / ${E(d.category)}</div>
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
        <div class="section compact">
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Respostas</div>
              <h2>${data.replies.length} contribuiç${data.replies.length === 1 ? 'ão' : 'ões'}</h2>
            </div>
          </div>
          ${data.replies
            .map(
              (reply) =>
                html`<div class="reply">
                  <strong>${E(reply.authorName)}</strong>
                  <span class="muted small">· ${date(reply.createdAt)}</span>
                  <p>${E(reply.body)}</p>
                  <button
                    class="linkbtn"
                    style="background: none; border: 0; padding: 0"
                    data-report="reply:${E(reply.id)}"
                  >
                    Denunciar
                  </button>
                </div>`,
            )
            .join('') || empty('Ainda não há respostas.')}
          <div class="card" style="margin-top: 20px">
            <h3>Responder ao colóquio</h3>
            ${state.me
              ? html`<form data-reply="${E(d.id)}">
                  <textarea
                    class="textarea"
                    name="body"
                    placeholder="Contribua com argumento, pergunta ou referência…"
                    required
                  ></textarea>
                  <div class="actions" style="margin-top: 10px">
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
        <p class="small">Ainda não tem conta? ${link('/cadastro', 'Criar conta.')}</p>
      </form>
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

export { coloquio, thread, login, cadastro };

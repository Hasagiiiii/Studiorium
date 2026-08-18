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

function oficina() {
  const all = state.boot.techResources || [],
    hub = state.query.get('hub') || '',
    q = (state.query.get('q') || '').toLowerCase();
  const hubs = [
    ['Tecnologia', 'Tutoriais, programação e projetos da comunidade'],
    ['Jogos', 'Desenvolvimento, mods, configuração e desempenho'],
    ['PC & Hardware', 'Problemas, montagem, upgrades e combinações de peças'],
    ['Carros', 'Guias, diagnóstico básico, manutenção e projetos automotivos'],
    ['Motos', 'Manutenção, diagnóstico básico e projetos de motocicletas'],
  ];
  const rows = all.filter(
    (x) => (!hub || x.hub === hub) && (!q || JSON.stringify(x).toLowerCase().includes(q)),
  );
  layout(
    html`<section class="pagehero">
        <div class="shell">
          <div class="eyebrow">Officina Technica</div>
          <h1 class="pagetitle">Tecnologia & Oficina</h1>
          <p>
            Uma área separada para aprender, construir e compartilhar soluções práticas — de
            software e jogos a PCs, carros e motos.
          </p>
          <div class="actions">
            ${state.me
              ? '<button class="solid" data-open-tech>Publicar tutorial ou projeto</button>'
              : link('/login', 'Entrar para publicar', 'solid')}${link(
              '/laboratorio',
              'Abrir Laboratório de Código',
              'outline',
            )}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="tech-hubs">
            ${hubs
              .map(
                ([h, d]) =>
                  html`<a
                    data-link
                    href="/oficina?hub=${encodeURIComponent(h)}"
                    class="card tech-hub"
                    ><div class="eyebrow">${E(h)}</div>
                    <h3>${E(h)}</h3>
                    <p>${E(d)}</p></a
                  >`,
              )
              .join('')}
          </div>
          <form class="library-filter" data-tech-filter>
            <div class="library-search">
              <input
                class="field"
                name="q"
                value="${E(state.query.get('q') || '')}"
                placeholder="Pesquisar tutoriais, problemas, peças, projetos…"
              /><button class="solid">Buscar</button>
            </div>
          </form>
          <div id="techComposer"></div>
          ${['Carros', 'Motos'].includes(hub)
            ? html`<div class="notice" style="margin: 18px 0">
                Conteúdo automotivo é educativo. Procedimentos envolvendo freios, direção, airbags,
                combustível, alta tensão ou outros sistemas críticos devem ser realizados por
                profissional qualificado.
              </div>`
            : ''}
          <div class="sectionhead">
            <div>
              <div class="eyebrow">Comunidade</div>
              <h2>${E(hub || 'Publicações recentes')}</h2>
            </div>
            <span>${rows.length} itens</span>
          </div>
          <div class="grid3">
            ${rows
              .map(
                (x) =>
                  html`<article class="card">
                    <div class="eyebrow">${E(x.hub)} · ${E(x.category)}</div>
                    <h3>${E(x.title)}</h3>
                    <p>${E(x.summary)}</p>
                    <div class="pills">
                      ${(x.tags || []).map((t) => html`<span class="pill">${E(t)}</span>`).join('')}
                    </div>
                    <div class="meta">
                      <span>${E(x.authorName)}</span><span>${date(x.createdAt)}</span>
                    </div>
                  </article>`,
              )
              .join('') || empty('Ainda não há conteúdo publicado nessa área.')}
          </div>
        </div>
      </section>`,
  );
}

async function laboratorio(projectId = '') {
  if (!state.me) return requireLogin();
  let project = null;
  if (projectId) {
    try {
      project = (await api('/api/code-projects/' + encodeURIComponent(projectId))).project;
    } catch (e) {
      return notFound();
    }
  }
  if (!project) {
    layout(
      html`<section class="pagehero">
        <div class="shell">
          <div class="eyebrow">Studiorium Lab</div>
          <h1 class="pagetitle">Crie projetos e code no navegador</h1>
          <p>
            Um espaço para experimentar HTML, CSS e JavaScript, salvar projetos na sua conta e
            compartilhar quando quiser.
          </p>
          <div class="actions">
            <button class="solid" data-new-code-project>Novo projeto</button>${link(
              '/escrivaninha',
              'Meus projetos',
              'outline',
            )}
          </div>
          <div class="notice" style="margin-top:20px">
            A prévia roda isolada em um iframe com sandbox. Código de servidor e programas nativos
            não são executados nesta versão.
          </div>
        </div>
      </section>`,
    );
    return;
  }
  layout(
    html`<section class="section code-lab">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Studiorium Lab</div>
            <input class="field code-title" name="codeTitle" value="${E(project.title)}" />
          </div>
          <div class="actions">
            <select class="select" name="codeVisibility">
              <option value="private" ${project.visibility === 'private' ? 'selected' : ''}>
                Privado
              </option>
              <option value="public" ${project.visibility === 'public' ? 'selected' : ''}>
                Público
              </option></select
            ><button class="outline" data-run-code>Executar prévia</button
            ><button class="solid" data-save-code="${E(project.id)}">Salvar</button>
          </div>
        </div>
        <div class="code-grid">
          <div class="code-editors">
            <label
              >HTML<textarea class="codearea" name="codeHtml" spellcheck="false">
${E(project.html)}</textarea
              ></label
            ><label
              >CSS<textarea class="codearea" name="codeCss" spellcheck="false">
${E(project.css)}</textarea
              ></label
            ><label
              >JavaScript<textarea class="codearea" name="codeJs" spellcheck="false">
${E(project.javascript)}</textarea
              >
            </label>
          </div>
          <div class="preview-pane">
            <div class="eyebrow">Prévia segura</div>
            <iframe id="codePreview" sandbox="allow-scripts" title="Prévia do projeto"></iframe>
          </div>
        </div>
      </div>
    </section>`,
  );
  setTimeout(() => runCodePreview(), 0);
}

function runCodePreview() {
  const frame = document.getElementById('codePreview');
  if (!frame) return;
  const h = document.querySelector('[name=codeHtml]')?.value || '',
    c = document.querySelector('[name=codeCss]')?.value || '',
    j = document.querySelector('[name=codeJs]')?.value || '';
  const safeJs = j.split('</script').join('<\/script');
  frame.srcdoc = html`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${c}
        </style>
      </head>
      <body>
        ${h}
        <script>
          ${safeJs};
        </script>
      </body>
    </html>`;
}

function requireLogin() {
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="card" style="max-width:620px;margin:auto;text-align:center">
          <div class="eyebrow">Área reservada</div>
          <h1 class="pagetitle">Entre para continuar</h1>
          <p>Essa função salva conteúdo em sua conta online do Studiorium.</p>
          <div class="actions" style="justify-content:center">
            ${link('/login', 'Entrar', 'solid')}${link('/cadastro', 'Criar conta', 'outline')}
          </div>
        </div>
      </div>
    </section>`,
  );
}

function notFound() {
  layout(
    html`<div class="errorpage">
      <div class="eyebrow">Error 404</div>
      <h1>Página não encontrada</h1>
      <p>Este registro não existe no arquivo do Studiorium.</p>
      ${link('/', 'Voltar ao início', 'solid')}
    </div>`,
  );
}

export { oficina, laboratorio, runCodePreview, requireLogin, notFound };

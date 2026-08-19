import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import { rankRelated } from '../content-intelligence.js';
import { techResourceForm } from '../events/composers.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  requireLogin,
  notFound,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

async function oficina() {
  const editId = state.query.get('editar') || '';
  let editing = null;

  if (state.me && editId) {
    const result = await api(`/api/tech-resources/${encodeURIComponent(editId)}`);
    editing = result.resource;
  }

  const all = state.boot.techResources || [],
    hub = state.query.get('hub') || '',
    q = (state.query.get('q') || '').toLowerCase(),
    openComposer = state.me && (state.query.get('novo') === '1' || editing);
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
          <div id="techComposer">${openComposer ? techResourceForm(editing || {}) : ''}</div>
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
                    <div class="actions space-top">
                      ${link(
                        `/oficina/${encodeURIComponent(x.slug)}`,
                        'Ler conteúdo completo',
                        'outline',
                      )}
                    </div>
                  </article>`,
              )
              .join('') || empty('Ainda não há conteúdo publicado nessa área.')}
          </div>
        </div>
      </section>`,
  );
}

async function oficinaDetail(slug) {
  const { resource } = await api(`/api/tech-resources/public/${encodeURIComponent(slug)}`);
  const relatedResources = rankRelated(resource, state.boot.techResources || []);
  layout(
    html`<section class="pagehero article-hero">
        <div class="shell article-width">
          <div class="crumbs">${link('/oficina', 'Oficina')} / ${E(resource.hub)}</div>
          <div class="eyebrow">${E(resource.hub)} · ${E(resource.category)}</div>
          <h1 class="pagetitle">${E(resource.title)}</h1>
          <p class="article-summary">${E(resource.summary)}</p>
          <div class="meta article-meta">
            <span>Por ${E(resource.authorName)}</span>
            <span>Atualizado em ${date(resource.updatedAt)}</span>
          </div>
        </div>
      </section>
      <section class="section compact">
        <div class="shell article-layout">
          <article class="article-body">${E(resource.body)}</article>
          <aside class="article-sources">
            <div class="eyebrow">Classificação</div>
            <h2>${E(resource.hub)}</h2>
            <p>${E(resource.category)}</p>
            <div class="pills">
              ${(resource.tags || [])
                .map((tag) => html`<span class="pill">${E(tag)}</span>`)
                .join('')}
            </div>
            <div class="actions space-top">${link('/oficina', 'Voltar à Oficina', 'outline')}</div>
          </aside>
        </div>
        ${relatedResources.length
          ? html`<section class="contextual-discovery article-width">
              <div class="sectionhead">
                <div>
                  <div class="eyebrow">Próximos passos</div>
                  <h2>Soluções ligadas a este guia</h2>
                  <p>Aproximação feita pelo problema, categoria, área técnica e etiquetas.</p>
                </div>
              </div>
              <div class="grid grid3">
                ${relatedResources
                  .map(
                    (item) =>
                      html`<article class="card">
                        <div class="eyebrow">${E(item.hub)} · ${E(item.category)}</div>
                        <h3>${E(item.title)}</h3>
                        <p>${E(item.summary)}</p>
                        ${link(
                          `/oficina/${encodeURIComponent(item.slug)}`,
                          'Abrir guia',
                          'outline',
                        )}
                      </article>`,
                  )
                  .join('')}
              </div>
            </section>`
          : ''}
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
            <span class="badge status-saved" data-code-save-state>Salvo</span>
            <label class="lab-live-toggle">
              <input type="checkbox" data-live-preview checked /> Prévia ao digitar
            </label>
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
            <div class="preview-pane-head">
              <div>
                <div class="eyebrow">Prévia segura</div>
                <span data-lab-run-status>Preparando execução…</span>
              </div>
              <button class="soft" type="button" data-clear-lab-console>Limpar console</button>
            </div>
            <iframe id="codePreview" sandbox="allow-scripts" title="Prévia do projeto"></iframe>
            <section class="lab-console" aria-label="Console da prévia">
              <header><strong>Console</strong><span>Mensagens e erros desta execução</span></header>
              <ol data-lab-console-list aria-live="polite">
                <li class="empty-log">Execute a prévia para acompanhar o código.</li>
              </ol>
            </section>
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
  const runId = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const consoleList = document.querySelector('[data-lab-console-list]');
  const runStatus = document.querySelector('[data-lab-run-status]');

  frame.dataset.runId = runId;
  if (consoleList) consoleList.innerHTML = '<li class="empty-log">Executando nova prévia…</li>';
  if (runStatus) {
    runStatus.textContent = 'Executando…';
    runStatus.className = 'running';
  }
  frame.srcdoc = html`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${c}
        </style>
        <script>
          (() => {
            const runId = ${JSON.stringify(runId)};
            const send = (type, values = []) => {
              const args = values.map((value) => {
                if (typeof value === 'string') return value;
                try {
                  return JSON.stringify(value);
                } catch {
                  return String(value);
                }
              });
              parent.postMessage({ channel: 'studiorium-lab', runId, type, args }, '*');
            };
            ['log', 'info', 'warn', 'error'].forEach((type) => {
              const original = console[type];
              console[type] = (...args) => {
                send(type, args);
                original.apply(console, args);
              };
            });
            addEventListener('error', (event) => send('error', [event.message]));
            addEventListener('unhandledrejection', (event) => {
              send('error', ['Promise rejeitada:', event.reason]);
            });
            addEventListener('DOMContentLoaded', () => send('ready'));
          })();
        </script>
      </head>
      <body>
        ${h}
        <script>
          try {
            ${safeJs};
          } catch (error) {
            console.error(error && error.stack ? error.stack : error);
          }
        </script>
      </body>
    </html>`;
}

export { oficina, oficinaDetail, laboratorio, runCodePreview, notFound };

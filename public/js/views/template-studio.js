import { state, api, E, date, html } from '../runtime.js';
import { layout, link, empty } from './core.js';

function studioCard(template) {
  return html`<article class="card studio-card">
    <div class="sectionhead compact-head">
      <span class="eyebrow">${E(template.sourceType)}</span>
      <span class="badge">${E(template.status)}</span>
    </div>
    <div
      class="template-miniature"
      style="--template-bg:${E(template.document?.settings?.background || '#f2eadb')}"
    >
      <span></span><strong>${E(template.title)}</strong><span></span><span></span>
    </div>
    <h3>${E(template.title)}</h3>
    <p>${E(template.description || 'Template livre para personalizar.')}</p>
    <div class="actions">
      ${link(`/estudio-templates/${encodeURIComponent(template.id)}`, 'Editar', 'solid')}
      <button class="dangerbtn" data-trash-template="${E(template.id)}">Excluir</button>
    </div>
  </article>`;
}

async function templateStudio() {
  if (!state.me) {
    layout(
      html`<section class="pagehero">
        <div class="shell">
          ${empty('Entre em sua conta para criar templates.')}
          <div class="actions center-actions">${link('/login', 'Entrar', 'solid')}</div>
        </div>
      </section>`,
    );
    return;
  }
  const { templates } = await api('/api/custom-templates/mine');
  const active = templates.filter((template) => !template.deletedAt);
  const trashed = templates.filter((template) => template.deletedAt);
  layout(
    html`<section class="pagehero studio-page">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Officina formarum</div>
            <h1 class="pagetitle">Estúdio livre de templates</h1>
            <p>Crie do zero, use fotos e importe JSON, PNG, JPG, WebP ou PDF como referência.</p>
          </div>
          ${link('/acervo', 'Ver acervo', 'outline')}
        </div>
        <div class="studio-start card">
          <div>
            <h2>Novo documento</h2>
            <p>Blocos livres, cores, tamanhos de página e imagens próprias.</p>
          </div>
          <div class="actions">
            <button class="solid" data-new-custom-template>Criar em branco</button>
            <label class="outline file-button">
              Importar arquivo
              <input data-import-template type="file" accept=".json,.png,.jpg,.jpeg,.webp,.pdf" />
            </label>
          </div>
        </div>
        <div class="sectionhead section-gap">
          <div>
            <div class="eyebrow">Sua coleção</div>
            <h2>Templates editáveis</h2>
          </div>
        </div>
        <div class="grid grid3">
          ${active.map(studioCard).join('') || empty('Crie seu primeiro template.')}
        </div>
        ${trashed.length
          ? html`<details class="card trash-panel section-gap">
              <summary>Lixeira de templates (${trashed.length})</summary>
              ${trashed
                .map(
                  (template) =>
                    html`<div class="project">
                      <div>
                        <h3>${E(template.title)}</h3>
                        <p>Excluído em ${date(template.deletedAt)}</p>
                      </div>
                      <div class="actions">
                        <button class="outline" data-restore-template="${E(template.id)}">
                          Restaurar
                        </button>
                        <button class="dangerbtn" data-purge-template="${E(template.id)}">
                          Excluir definitivamente
                        </button>
                      </div>
                    </div>`,
                )
                .join('')}
            </details>`
          : ''}
      </div>
    </section>`,
  );
}

function templateBlock(block, index) {
  const contentField = ['heading', 'text', 'quote'].includes(block.type)
    ? html`<textarea class="textarea" data-block-content>${E(block.content || '')}</textarea>`
    : block.type === 'image'
      ? html`<img src="${E(block.src || '')}" alt="${E(block.alt || '')}" />
          <input
            class="field"
            data-block-alt
            value="${E(block.alt || '')}"
            placeholder="Descrição da imagem"
          />`
      : block.type === 'reference'
        ? html`<a href="${E(block.src || '#')}" target="_blank" rel="noopener"
            >${E(block.content || 'Abrir referência importada')} ↗</a
          >`
        : '<hr />';
  return html`<div
    class="template-block type-${E(block.type)}"
    data-template-block
    data-block-id="${E(block.id)}"
    data-block-type="${E(block.type)}"
    data-asset-path="${E(block.assetPath || '')}"
  >
    <div class="block-toolbar">
      <span>${index + 1} · ${E(block.type)}</span>
      <div>
        <button type="button" class="soft" data-move-block="up" aria-label="Mover para cima">
          ↑
        </button>
        <button type="button" class="soft" data-move-block="down" aria-label="Mover para baixo">
          ↓
        </button>
        <button type="button" class="dangerbtn" data-remove-block aria-label="Remover bloco">
          ×
        </button>
      </div>
    </div>
    ${contentField}
  </div>`;
}

function templateCanvas(template) {
  const settings = template.document.settings;
  return html`<div
    class="template-canvas size-${E(settings.pageSize)}"
    data-template-canvas
    style="--canvas-bg:${E(settings.background)};--canvas-text:${E(
      settings.textColor,
    )};--canvas-accent:${E(settings.accentColor)}"
  >
    ${template.document.blocks.map(templateBlock).join('')}
  </div>`;
}

async function templateEditor(templateId) {
  if (!state.me) return templateStudio();
  const { template } = await api(`/api/custom-templates/${encodeURIComponent(templateId)}`);
  layout(
    html`<section class="pagehero template-editor-page">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Editor visual</div>
            <h1 class="pagetitle">${E(template.title)}</h1>
          </div>
          <div class="actions">
            ${link('/estudio-templates', 'Voltar', 'outline')}
            <button class="solid" data-save-custom-template="${E(template.id)}">Salvar</button>
            <button class="outline" data-submit-custom-template="${E(template.id)}">
              Enviar ao acervo
            </button>
          </div>
        </div>
        <div
          class="template-editor-layout"
          data-template-editor
          data-template-id="${E(template.id)}"
        >
          <aside class="card template-tools">
            <h2>Documento</h2>
            <label class="label">Título</label>
            <input class="field" data-template-title value="${E(template.title)}" />
            <label class="label">Descrição</label>
            <textarea class="textarea compact-textarea" data-template-description>
${E(template.description)}</textarea
            >
            <div class="formgrid color-grid">
              <label
                >Fundo<input
                  type="color"
                  data-template-setting="background"
                  value="${E(template.document.settings.background)}"
              /></label>
              <label
                >Texto<input
                  type="color"
                  data-template-setting="textColor"
                  value="${E(template.document.settings.textColor)}"
              /></label>
              <label
                >Destaque<input
                  type="color"
                  data-template-setting="accentColor"
                  value="${E(template.document.settings.accentColor)}"
              /></label>
            </div>
            <label class="label">Tamanho</label>
            <select class="select" data-template-setting="pageSize">
              ${['A4', 'Carta', 'Apresentação']
                .map(
                  (size) =>
                    html`<option ${size === template.document.settings.pageSize ? 'selected' : ''}>
                      ${size}
                    </option>`,
                )
                .join('')}
            </select>
            <h2>Adicionar bloco</h2>
            <div class="block-buttons">
              ${['heading', 'text', 'quote', 'divider']
                .map(
                  (type) =>
                    html`<button class="outline" type="button" data-add-template-block="${type}">
                      ${type}
                    </button>`,
                )
                .join('')}
            </div>
            <label class="outline file-button full-button">
              Adicionar foto ou PDF
              <input data-template-asset type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" />
            </label>
            <div class="notice">
              Arquivos de outras plataformas entram como imagem ou referência. Os blocos colocados
              sobre eles continuam totalmente editáveis.
            </div>
          </aside>
          <div class="template-stage">${templateCanvas(template)}</div>
        </div>
      </div>
    </section>`,
  );
}

async function publicCustomTemplate(templateId) {
  const { template } = await api(`/api/custom-templates/${encodeURIComponent(templateId)}`);
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Modelo da comunidade</div>
            <h1 class="pagetitle">${E(template.title)}</h1>
          </div>
          ${state.me
            ? html`<button class="solid" data-copy-custom-template="${E(template.id)}">
                Criar uma cópia
              </button>`
            : link('/login', 'Entrar para usar', 'solid')}
        </div>
        <p>${E(template.description)}</p>
        <div class="public-template-preview">${templateCanvas(template)}</div>
      </div>
    </section>`,
  );
}

export { templateStudio, templateEditor, publicCustomTemplate, templateBlock };

import { E, html } from '../runtime.js';

const techHubs = ['Tecnologia', 'Jogos', 'PC & Hardware', 'Carros', 'Motos'];
const techCategories = [
  'Tutorial',
  'Projeto da comunidade',
  'Resolução de problema',
  'Guia de compra',
  'Compatibilidade',
  'Manutenção',
];

function selectOptions(options, selected) {
  return options
    .map(
      (option) =>
        html`<option value="${E(option)}" ${option === selected ? 'selected' : ''}>
          ${E(option)}
        </option>`,
    )
    .join('');
}

export function techResourceForm(resource = {}) {
  const editing = Boolean(resource.id);
  const tags = Array.isArray(resource.tags) ? resource.tags.join(', ') : resource.tags || '';

  return html`
    <form class="card" data-tech-resource="${E(resource.id || '')}">
      <div class="eyebrow">${editing ? 'Reaproveitar envio' : 'Contribuição da comunidade'}</div>
      <h3>${editing ? 'Editar conteúdo enviado' : 'Publicar na Tech & Oficina'}</h3>
      ${editing
        ? html`<p class="notice">
            Salve as alterações para devolver este conteúdo à fila de revisão.
          </p>`
        : ''}
      <div class="formrow">
        <label class="label">Título</label>
        <input
          class="field"
          name="title"
          value="${E(resource.title || '')}"
          required
          minlength="5"
        />
      </div>
      <div class="formgrid">
        <div>
          <label class="label">Área</label>
          <select class="select" name="hub">
            ${selectOptions(techHubs, resource.hub || 'Tecnologia')}
          </select>
        </div>
        <div>
          <label class="label">Tipo</label>
          <select class="select" name="category">
            ${selectOptions(techCategories, resource.category || 'Tutorial')}
          </select>
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="summary" required>${E(resource.summary || '')}</textarea>
      </div>
      <div class="formrow">
        <label class="label">Conteúdo</label>
        <textarea class="textarea article-textarea" name="body" required>
${E(resource.body || '')}</textarea
        >
      </div>
      <div class="formrow">
        <label class="label">Tags (separadas por vírgula)</label>
        <input class="field" name="tags" value="${E(tags)}" />
      </div>
      <div class="actions">
        <button class="solid" type="submit">
          ${editing ? 'Salvar e reenviar' : 'Enviar para revisão'}
        </button>
        <button class="soft" type="reset">
          ${editing ? 'Restaurar valores' : 'Limpar formulário'}
        </button>
        <button class="outline" type="button" data-cancel-tech>Cancelar</button>
      </div>
    </form>
  `;
}

export function discussionForm(options = {}) {
  const communitySlug = String(options.communitySlug || '').trim();
  const communityName = String(options.communityName || '').trim();

  return html`
    <form class="card discussion-composer" data-new-discussion-form style="margin-top: 20px">
      <div class="eyebrow">Nova mesa</div>
      <h3>Abrir discussão${communityName ? ` em ${E(communityName)}` : ''}</h3>
      ${communitySlug
        ? html`<input type="hidden" name="communitySlug" value="${E(communitySlug)}" />
            <div class="notice discussion-community-context">
              Este Colóquio ficará vinculado à comunidade <strong>${E(communityName)}</strong>.
            </div>`
        : ''}
      <div class="formrow">
        <label class="label">Título</label>
        <input class="field" name="title" required minlength="6" />
      </div>
      ${communitySlug
        ? ''
        : html`<div class="formrow">
            <label class="label">Categoria</label>
            <input
              class="field"
              name="category"
              placeholder="Ex.: Matemática, Educação, Tecnologia"
            />
          </div>`}
      <div class="formrow">
        <label class="label">Contexto da discussão</label>
        <textarea class="textarea" name="body" required minlength="10"></textarea>
      </div>
      <button class="solid">Publicar discussão</button>
    </form>
  `;
}

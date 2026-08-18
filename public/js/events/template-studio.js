import { api, E, fileToBase64, toast } from '../runtime.js';
import { goto, render } from '../router.js';

function blockMarkup(type, options = {}) {
  const id = `block_${crypto.randomUUID()}`;
  const content = options.content || (type === 'heading' ? 'Novo título' : 'Escreva aqui…');
  const field = ['heading', 'text', 'quote'].includes(type)
    ? `<textarea class="textarea" data-block-content>${E(content)}</textarea>`
    : type === 'image'
      ? `<img src="${E(options.src)}" alt="" /><input class="field" data-block-alt placeholder="Descrição da imagem" />`
      : type === 'reference'
        ? `<a href="${E(options.src)}" target="_blank" rel="noopener">${E(options.name)} ↗</a>`
        : '<hr />';
  return `<div class="template-block type-${type}" data-template-block data-block-id="${id}"
    data-block-type="${E(type)}" data-asset-path="${E(options.assetPath || '')}">
    <div class="block-toolbar"><span>${type}</span><div>
      <button type="button" class="soft" data-move-block="up">↑</button>
      <button type="button" class="soft" data-move-block="down">↓</button>
      <button type="button" class="dangerbtn" data-remove-block>×</button>
    </div></div>${field}</div>`;
}

function editorPayload(submit = false) {
  const editor = document.querySelector('[data-template-editor]');
  const setting = (name) => editor.querySelector(`[data-template-setting="${name}"]`).value;
  const blocks = [...editor.querySelectorAll('[data-template-block]')].map((block) => ({
    id: block.dataset.blockId,
    type: block.dataset.blockType,
    content:
      block.querySelector('[data-block-content]')?.value ||
      block.querySelector('a')?.textContent ||
      '',
    alt: block.querySelector('[data-block-alt]')?.value || '',
    assetPath: block.dataset.assetPath || '',
  }));
  return {
    title: editor.querySelector('[data-template-title]').value,
    description: editor.querySelector('[data-template-description]').value,
    document: {
      settings: {
        background: setting('background'),
        textColor: setting('textColor'),
        accentColor: setting('accentColor'),
        pageSize: setting('pageSize'),
      },
      blocks,
    },
    submit,
  };
}

async function importTemplate(file) {
  if (file.name.toLowerCase().endsWith('.json')) {
    const document = JSON.parse(await file.text());
    const result = await api('/api/custom-templates', {
      method: 'POST',
      body: JSON.stringify({
        title: file.name.replace(/\.json$/i, ''),
        document,
        sourceType: 'imported_json',
      }),
    });
    goto(`/estudio-templates/${encodeURIComponent(result.template.id)}`);
    return;
  }
  const isPdf = file.type === 'application/pdf';
  const result = await api('/api/custom-templates', {
    method: 'POST',
    body: JSON.stringify({
      title: file.name.replace(/\.[^.]+$/, ''),
      sourceType: isPdf ? 'imported_pdf' : 'imported_image',
    }),
  });
  const asset = await upload(result.template.id, file);
  const block = {
    id: `block_${crypto.randomUUID()}`,
    type: asset.kind,
    content: asset.name,
    assetPath: asset.path,
  };
  await api(`/api/custom-templates/${encodeURIComponent(result.template.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      document: {
        ...result.template.document,
        blocks: [block, ...result.template.document.blocks],
      },
    }),
  });
  goto(`/estudio-templates/${encodeURIComponent(result.template.id)}`);
}

async function upload(templateId, file) {
  return (
    await api(`/api/custom-templates/${encodeURIComponent(templateId)}/assets`, {
      method: 'POST',
      body: JSON.stringify({
        file: { name: file.name, mime: file.type, dataBase64: await fileToBase64(file) },
      }),
    })
  ).asset;
}

export async function handleTemplateClick(event) {
  if (event.target.closest('[data-new-custom-template]')) {
    const result = await api('/api/custom-templates', { method: 'POST', body: '{}' });
    goto(`/estudio-templates/${encodeURIComponent(result.template.id)}`);
    return true;
  }
  const copy = event.target.closest('[data-copy-custom-template]');
  if (copy) {
    const original = await api(
      `/api/custom-templates/${encodeURIComponent(copy.dataset.copyCustomTemplate)}`,
    );
    const result = await api('/api/custom-templates', {
      method: 'POST',
      body: JSON.stringify({
        title: `Cópia de ${original.template.title}`,
        description: original.template.description,
        document: original.template.document,
        sourceType: 'editor',
      }),
    });
    toast('Cópia criada no seu estúdio.');
    goto(`/estudio-templates/${encodeURIComponent(result.template.id)}`);
    return true;
  }
  const addBlock = event.target.closest('[data-add-template-block]');
  if (addBlock) {
    document
      .querySelector('[data-template-canvas]')
      ?.insertAdjacentHTML('beforeend', blockMarkup(addBlock.dataset.addTemplateBlock));
    return true;
  }
  const removeBlock = event.target.closest('[data-remove-block]');
  if (removeBlock) {
    removeBlock.closest('[data-template-block]')?.remove();
    return true;
  }
  const moveBlock = event.target.closest('[data-move-block]');
  if (moveBlock) {
    const block = moveBlock.closest('[data-template-block]');
    const sibling =
      moveBlock.dataset.moveBlock === 'up'
        ? block.previousElementSibling
        : block.nextElementSibling;
    if (sibling) sibling[moveBlock.dataset.moveBlock === 'up' ? 'before' : 'after'](block);
    return true;
  }
  const save = event.target.closest('[data-save-custom-template], [data-submit-custom-template]');
  if (save) {
    const templateId = save.dataset.saveCustomTemplate || save.dataset.submitCustomTemplate;
    const submit = Boolean(save.dataset.submitCustomTemplate);
    if (submit && !confirm('Enviar este template para revisão e possível publicação no acervo?'))
      return true;
    await api(`/api/custom-templates/${encodeURIComponent(templateId)}`, {
      method: 'PATCH',
      body: JSON.stringify(editorPayload(submit)),
    });
    toast(submit ? 'Template enviado para revisão.' : 'Template salvo.');
    if (submit) goto('/estudio-templates');
    return true;
  }

  for (const [attribute, endpoint, method, question, message] of [
    [
      'trashTemplate',
      '',
      'DELETE',
      'Mover este template para a lixeira?',
      'Template movido para a lixeira.',
    ],
    ['restoreTemplate', '/restore', 'POST', '', 'Template restaurado.'],
    [
      'purgeTemplate',
      '/purge',
      'DELETE',
      'Excluir definitivamente o template e seus arquivos?',
      'Template excluído definitivamente.',
    ],
  ]) {
    const name = attribute.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
    const button = event.target.closest(`[data-${name}]`);
    if (!button) continue;
    if (question && !confirm(question)) return true;
    await api(`/api/custom-templates/${encodeURIComponent(button.dataset[attribute])}${endpoint}`, {
      method,
      body: method === 'POST' ? '{}' : undefined,
    });
    toast(message);
    await render();
    return true;
  }
  return false;
}

export async function handleTemplateChange(event) {
  if (event.target.matches('[data-import-template]') && event.target.files[0]) {
    await importTemplate(event.target.files[0]);
    return true;
  }
  if (event.target.matches('[data-template-asset]') && event.target.files[0]) {
    const editor = document.querySelector('[data-template-editor]');
    const asset = await upload(editor.dataset.templateId, event.target.files[0]);
    document.querySelector('[data-template-canvas]')?.insertAdjacentHTML(
      'beforeend',
      blockMarkup(asset.kind, {
        src: asset.src,
        assetPath: asset.path,
        name: asset.name,
      }),
    );
    toast('Arquivo adicionado ao template.');
    return true;
  }
  if (event.target.matches('[data-template-setting]')) {
    const canvas = document.querySelector('[data-template-canvas]');
    const name = event.target.dataset.templateSetting;
    if (name === 'background') canvas.style.setProperty('--canvas-bg', event.target.value);
    if (name === 'textColor') canvas.style.setProperty('--canvas-text', event.target.value);
    if (name === 'accentColor') canvas.style.setProperty('--canvas-accent', event.target.value);
    if (name === 'pageSize') canvas.className = `template-canvas size-${event.target.value}`;
    return true;
  }
  return false;
}

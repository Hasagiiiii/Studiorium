let activeDialog = null;

function closeActiveDialog(value = null) {
  if (!activeDialog) return;
  const { overlay, resolve, previousFocus, keyHandler } = activeDialog;
  activeDialog = null;
  document.removeEventListener('keydown', keyHandler);
  document.body.classList.remove('ui-dialog-open');
  overlay.classList.remove('open');
  window.setTimeout(() => overlay.remove(), 160);
  if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  resolve(value);
}

function createField(field) {
  const wrapper = document.createElement('label');
  wrapper.className = 'ui-dialog-field';

  const label = document.createElement('span');
  label.textContent = field.label || field.name;
  wrapper.append(label);

  let control;
  if (field.type === 'select') {
    control = document.createElement('select');
    control.className = 'select';
    for (const option of field.options || []) {
      const element = document.createElement('option');
      const value = typeof option === 'string' ? option : option.value;
      const text = typeof option === 'string' ? option : option.label;
      element.value = value;
      element.textContent = text;
      if (value === field.value) element.selected = true;
      control.append(element);
    }
  } else if (field.type === 'textarea') {
    control = document.createElement('textarea');
    control.className = 'textarea';
    control.rows = field.rows || 4;
  } else {
    control = document.createElement('input');
    control.className = 'field';
    control.type = field.type || 'text';
  }

  control.name = field.name;
  control.value = field.value || '';
  control.placeholder = field.placeholder || '';
  control.required = Boolean(field.required);
  if (field.maxLength) control.maxLength = field.maxLength;
  wrapper.append(control);
  return { wrapper, control };
}

export function formDialog({
  title = 'Confirmação',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  fields = [],
} = {}) {
  if (activeDialog) closeActiveDialog(null);

  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'ui-dialog-backdrop';

    const form = document.createElement('form');
    form.className = `ui-dialog${danger ? ' danger' : ''}`;
    form.setAttribute('role', 'dialog');
    form.setAttribute('aria-modal', 'true');

    const headingId = `ui-dialog-title-${crypto.randomUUID()}`;
    const heading = document.createElement('h2');
    heading.id = headingId;
    heading.textContent = title;
    form.setAttribute('aria-labelledby', headingId);

    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = danger ? 'Actio critica' : 'Studiorium';

    const header = document.createElement('header');
    header.className = 'ui-dialog-head';
    header.append(eyebrow, heading);

    const body = document.createElement('div');
    body.className = 'ui-dialog-body';
    if (message) {
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      body.append(paragraph);
    }

    const controls = [];
    for (const field of fields) {
      const created = createField(field);
      controls.push(created.control);
      body.append(created.wrapper);
    }

    const actions = document.createElement('div');
    actions.className = 'ui-dialog-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'outline';
    cancel.textContent = cancelLabel;

    const confirm = document.createElement('button');
    confirm.type = 'submit';
    confirm.className = danger ? 'dangerbtn' : 'solid';
    confirm.textContent = confirmLabel;
    actions.append(cancel, confirm);

    form.append(header, body, actions);
    overlay.append(form);
    document.body.append(overlay);
    document.body.classList.add('ui-dialog-open');

    const keyHandler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeActiveDialog(null);
      }
    };

    activeDialog = { overlay, resolve, previousFocus, keyHandler };
    document.addEventListener('keydown', keyHandler);

    cancel.addEventListener('click', () => closeActiveDialog(null));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeActiveDialog(null);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(controls.map((control) => [control.name, control.value]));
      closeActiveDialog(values);
    });

    requestAnimationFrame(() => {
      overlay.classList.add('open');
      (controls[0] || confirm).focus();
    });
  });
}

export async function confirmAction(message, options = {}) {
  const result = await formDialog({
    title: options.title || 'Confirmar ação',
    message,
    confirmLabel: options.confirmLabel || 'Confirmar',
    cancelLabel: options.cancelLabel || 'Cancelar',
    danger: Boolean(options.danger),
  });
  return result !== null;
}

export async function promptAction(message, options = {}) {
  const name = options.name || 'value';
  const result = await formDialog({
    title: options.title || 'Informação necessária',
    message,
    confirmLabel: options.confirmLabel || 'Continuar',
    cancelLabel: options.cancelLabel || 'Cancelar',
    danger: Boolean(options.danger),
    fields: [
      {
        name,
        label: options.label || 'Observação',
        type: options.multiline === false ? 'text' : 'textarea',
        value: options.value || '',
        placeholder: options.placeholder || '',
        required: Boolean(options.required),
        maxLength: options.maxLength || 1200,
      },
    ],
  });
  return result ? result[name] : null;
}

export function setControlBusy(control, busy) {
  if (!(control instanceof HTMLElement)) return;
  if (busy) {
    if (control.dataset.eventBusy === 'true') return;
    control.dataset.eventBusy = 'true';
    control.setAttribute('aria-busy', 'true');
    if ('disabled' in control) control.disabled = true;
    return;
  }
  delete control.dataset.eventBusy;
  control.removeAttribute('aria-busy');
  if ('disabled' in control) control.disabled = false;
}

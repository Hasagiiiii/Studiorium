function applyLibraryPolish() {
  if (!['/biblioteca', '/library'].includes(location.pathname)) return;

  const panel = document.querySelector('[data-armarium-community]');
  if (!panel) return;

  const heading = panel.querySelector('.armarium-community-head h2');
  if (heading && heading.textContent !== 'Leituras da comunidade') {
    heading.textContent = 'Leituras da comunidade';
  }

  const description = panel.querySelector('.armarium-community-head p');
  const descriptionText =
    'Inclua livros que você leu, publique reviews e abra discussões sobre obras, autores e temas relevantes.';
  if (description && description.textContent.trim() !== descriptionText) {
    description.textContent = descriptionText;
  }

  const addSummary = panel.querySelector('.armarium-add > summary');
  if (addSummary && addSummary.textContent.trim() !== 'Adicionar livro lido') {
    addSummary.textContent = 'Adicionar livro lido';
  }

  const emptyTitle = panel.querySelector('.armarium-empty strong');
  if (emptyTitle && emptyTitle.textContent !== 'Nenhum livro adicionado ainda.') {
    emptyTitle.textContent = 'Nenhum livro adicionado ainda.';
  }

  const emptyText = panel.querySelector('.armarium-empty span');
  const emptyMessage = 'Inclua uma leitura para começar a estante da comunidade.';
  if (emptyText && emptyText.textContent.trim() !== emptyMessage) {
    emptyText.textContent = emptyMessage;
  }
}

export function installLibraryPolish() {
  const root = document.getElementById('app');
  if (!root) return;

  const run = () => queueMicrotask(applyLibraryPolish);
  document.addEventListener('studiorium:rendered', run);

  if (root.childElementCount) run();
}

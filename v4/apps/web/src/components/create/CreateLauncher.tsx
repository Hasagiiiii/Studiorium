import { Link } from 'react-router-dom';

type CreateLauncherProps = {
  open: boolean;
  onClose(): void;
};

const actions = [
  {
    label: 'Discussão',
    description: 'Escolha uma comunidade e abra um novo tópico.',
    to: '/comunidades',
  },
  {
    label: 'Projeto',
    description: 'Crie ou continue um projeto no seu workspace.',
    to: '/projetos',
  },
  {
    label: 'Review de livro',
    description: 'Escolha uma obra da sua biblioteca e publique sua avaliação.',
    to: '/biblioteca',
  },
  {
    label: 'Tutorial',
    description: 'Publique conhecimento prático dentro de uma comunidade.',
    to: '/comunidades',
  },
  {
    label: 'Comunidade',
    description: 'Inicie o fluxo de criação de uma nova comunidade.',
    to: '/comunidades',
  },
] as const;

export function CreateLauncher({ open, onClose }: CreateLauncherProps) {
  if (!open) return null;

  return (
    <div className="create-launcher-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="create-launcher"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-launcher-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">Criar</span>
            <h2 id="create-launcher-title">O que você quer compartilhar?</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="create-launcher-grid">
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              onClick={onClose}
              className="create-launcher-action"
            >
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

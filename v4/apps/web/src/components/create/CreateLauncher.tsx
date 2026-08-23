import { Link } from 'react-router-dom';

type CreateLauncherProps = {
  open: boolean;
  onClose(): void;
};

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
            <h2 id="create-launcher-title">Comece algo novo</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="create-launcher-grid">
          <Link
            to="/projetos?criar=1"
            onClick={onClose}
            className="create-launcher-action"
          >
            <strong>Projeto</strong>
            <span>Crie um projeto real no seu workspace e escolha se ele será privado ou público.</span>
          </Link>
        </div>
        <p className="create-launcher-note">
          Discussões, reviews, tutoriais e novas comunidades aparecerão aqui somente quando os respectivos fluxos estiverem completos.
        </p>
      </section>
    </div>
  );
}

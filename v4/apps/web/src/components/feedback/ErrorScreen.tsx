type ErrorScreenProps = {
  message: string;
  onRetry(): void;
};

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <main id="main-content" className="system-state system-state-error" role="alert">
      <span className="eyebrow">Lorion</span>
      <h1>Não foi possível abrir a aplicação.</h1>
      <p>{message}</p>
      <p className="system-state-help">
        Você pode tentar novamente sem perder a rota atual. Se a conexão continuar instável,
        recarregue a página.
      </p>
      <div className="system-state-actions">
        <button type="button" className="button primary" onClick={onRetry}>
          Tentar novamente
        </button>
        <button type="button" className="button secondary" onClick={() => window.location.reload()}>
          Recarregar página
        </button>
      </div>
    </main>
  );
}

type ErrorScreenProps = {
  message: string;
  onRetry(): void;
};

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <main id="main-content" className="system-state" role="alert">
      <span className="eyebrow">Lorion</span>
      <h1>Não foi possível abrir a aplicação.</h1>
      <p>{message}</p>
      <button type="button" className="button primary" onClick={onRetry}>
        Tentar novamente
      </button>
    </main>
  );
}

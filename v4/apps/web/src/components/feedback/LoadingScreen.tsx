import { FeedSkeleton, SkeletonBlock } from './skeleton/Skeleton.js';

export function LoadingScreen() {
  return (
    <main
      id="main-content"
      className="loading-shell"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando Lorion"
    >
      <header className="loading-shell-topbar" aria-hidden="true">
        <div className="loading-shell-brand">
          <span className="loading-shell-mark" />
          <div>
            <SkeletonBlock className="loading-shell-brand-title" />
            <SkeletonBlock className="loading-shell-brand-copy" />
          </div>
        </div>
        <div className="loading-shell-actions">
          <SkeletonBlock className="loading-shell-action" />
          <SkeletonBlock className="loading-shell-avatar" />
        </div>
      </header>

      <section className="loading-shell-body">
        <header className="loading-screen-heading">
          <span className="eyebrow">Lorion</span>
          <SkeletonBlock className="skeleton-hero-title" />
          <SkeletonBlock className="skeleton-hero-copy" />
        </header>
        <FeedSkeleton cards={4} />
      </section>

      <p className="loading-shell-status">Preparando sua experiência…</p>
    </main>
  );
}

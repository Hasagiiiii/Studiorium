import { FeedSkeleton, SkeletonBlock } from './skeleton/Skeleton.js';

export function LoadingScreen() {
  return (
    <main id="main-content" className="loading-screen" aria-busy="true" aria-label="Carregando Lorion">
      <header className="loading-screen-heading">
        <span className="eyebrow">Lorion</span>
        <SkeletonBlock className="skeleton-hero-title" />
        <SkeletonBlock className="skeleton-hero-copy" />
      </header>
      <FeedSkeleton cards={4} />
    </main>
  );
}

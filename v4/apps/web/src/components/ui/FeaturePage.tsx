import type { ReactNode } from 'react';

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function FeaturePage({ eyebrow, title, description, children }: FeaturePageProps) {
  return (
    <main id="main-content" className="feature-page">
      <header className="feature-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </main>
  );
}

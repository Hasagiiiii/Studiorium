import { motion, useReducedMotion } from 'motion/react';

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  const reduceMotion = useReducedMotion();
  const classes = `skeleton-block ${className}`.trim();

  if (reduceMotion) {
    return <span aria-hidden="true" className={classes} />;
  }

  return (
    <motion.span
      aria-hidden="true"
      className={classes}
      animate={{ backgroundPositionX: ['180%', '-180%'] }}
      transition={{ duration: 1.35, ease: 'linear', repeat: Infinity }}
    />
  );
}

export function FeedSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="skeleton-feed" aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <article className="skeleton-card" key={index}>
          <SkeletonBlock className="skeleton-kicker" />
          <SkeletonBlock className="skeleton-title" />
          <SkeletonBlock className="skeleton-line" />
          <SkeletonBlock className="skeleton-line short" />
        </article>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useProgressiveFeed<T>(items: readonly T[], batchSize = 8) {
  const safeBatchSize = Math.max(1, batchSize);
  const [visibleCount, setVisibleCount] = useState(() => Math.min(safeBatchSize, items.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(safeBatchSize, items.length));
  }, [items, safeBatchSize]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + safeBatchSize, items.length));
  }, [items.length, safeBatchSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loadMore();
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return { visibleItems, hasMore, sentinelRef, loadMore };
}

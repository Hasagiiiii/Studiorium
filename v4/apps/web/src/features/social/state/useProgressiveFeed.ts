import { useEffect, useMemo, useRef, useState } from 'react';

export function useProgressiveFeed<T>(items: readonly T[], batchSize = 8) {
  const safeBatchSize = Math.max(1, batchSize);
  const [visibleCount, setVisibleCount] = useState(() => Math.min(safeBatchSize, items.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(safeBatchSize, items.length));
  }, [items, safeBatchSize]);

  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((current) => Math.min(current + safeBatchSize, items.length));
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, items.length, safeBatchSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return { visibleItems, hasMore, sentinelRef };
}

import { useEffect, useMemo, useState } from 'react';
import type { FeedEntry } from '@lorion/contracts';
import { buildPublicFeed, normalizeFeedMode, sortFeed, type FeedMode } from '@lorion/domain';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';

type FeedStatus = 'loading' | 'ready' | 'error';

export function useFeed(modeValue: string | null) {
  const { data } = useAppState();
  const mode = normalizeFeedMode(modeValue);
  const [remoteEntries, setRemoteEntries] = useState<FeedEntry[]>([]);
  const [status, setStatus] = useState<FeedStatus>('ready');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (mode !== 'following' || !data?.user) {
      setRemoteEntries([]);
      setStatus('ready');
      setError(null);
      return () => {
        active = false;
      };
    }

    setStatus('loading');
    setError(null);
    void services.social
      .feed()
      .then((result) => {
        if (!active) return;
        setRemoteEntries(result.feed);
        setStatus('ready');
      })
      .catch((cause) => {
        if (!active) return;
        setRemoteEntries([]);
        setStatus('error');
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o feed.');
      });

    return () => {
      active = false;
    };
  }, [mode, data?.user]);

  const entries = useMemo(() => {
    if (!data) return [];
    const source = mode === 'following' ? remoteEntries : buildPublicFeed(data);
    return sortFeed(source, mode as FeedMode, data.profiles).slice(0, 40);
  }, [data, mode, remoteEntries]);

  return { mode, entries, status, error };
}

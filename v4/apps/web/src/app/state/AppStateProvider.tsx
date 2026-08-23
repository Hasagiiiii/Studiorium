import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { BootstrapPayload } from '@lorion/contracts';
import { services } from '../services/services.js';
import { AppStateContext, type AppState, type AppStatus } from './context.js';

export function AppStateProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AppStatus>('loading');
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const next = await services.bootstrap.load();
      setData(next);
      setStatus('ready');
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o Lorion.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<AppState>(() => ({ status, data, error, reload }), [status, data, error, reload]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

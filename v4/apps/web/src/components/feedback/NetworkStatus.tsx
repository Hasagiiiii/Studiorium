import { useEffect, useRef, useState } from 'react';

type NetworkState = 'online' | 'offline' | 'reconnected';

function currentNetworkState(): NetworkState {
  return typeof navigator === 'undefined' || navigator.onLine ? 'online' : 'offline';
}

export function NetworkStatus() {
  const [state, setState] = useState<NetworkState>(currentNetworkState);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    function clearReconnectTimer() {
      if (reconnectTimer.current !== null) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    }

    function handleOffline() {
      clearReconnectTimer();
      setState('offline');
    }

    function handleOnline() {
      clearReconnectTimer();
      setState((previous) => (previous === 'offline' ? 'reconnected' : 'online'));
      reconnectTimer.current = window.setTimeout(() => {
        setState('online');
        reconnectTimer.current = null;
      }, 3200);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearReconnectTimer();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (state === 'online') return null;

  const reconnected = state === 'reconnected';
  return (
    <div
      className={`network-status ${reconnected ? 'is-reconnected' : 'is-offline'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="network-status-dot" aria-hidden="true" />
      <span>
        <strong>{reconnected ? 'Conexão restaurada' : 'Você está offline'}</strong>
        <small>
          {reconnected
            ? 'O Studiorium voltou a sincronizar as ações da interface.'
            : 'Você pode continuar navegando no que já carregou. Ações que dependem da rede podem falhar.'}
        </small>
      </span>
    </div>
  );
}

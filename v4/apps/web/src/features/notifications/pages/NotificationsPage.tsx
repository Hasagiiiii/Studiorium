import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Notification } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

type PageStatus = 'idle' | 'loading' | 'ready' | 'error';

export function NotificationsPage() {
  const { data } = useAppState();
  const [status, setStatus] = useState<PageStatus>('idle');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!data?.user) return;
    setStatus('loading');
    setError('');
    try {
      const result = await services.notifications.list();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setStatus('ready');
    } catch (cause) {
      setStatus('error');
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível carregar as notificações.',
      );
    }
  }, [data?.user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data?.user) {
    return (
      <FeaturePage
        eyebrow="Notificações"
        title="Entre para ver suas notificações"
        description="As notificações são privadas e vinculadas à sua conta."
      >
        <Link className="button primary" to="/entrar">
          Entrar
        </Link>
      </FeaturePage>
    );
  }

  async function markRead(item: Notification) {
    if (item.readAt) return;
    await services.notifications.markRead(item.id);
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, readAt } : entry)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    if (!unreadCount) return;
    await services.notifications.markAllRead();
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((entry) => ({ ...entry, readAt: entry.readAt || readAt })),
    );
    setUnreadCount(0);
  }

  return (
    <FeaturePage
      eyebrow="Notificações"
      title="Atualizações importantes"
      description="Seguidores, respostas, curtidas, menções e eventos das suas comunidades aparecem aqui."
    >
      <section className="notifications-panel" aria-live="polite">
        <header className="notifications-toolbar">
          <span>{unreadCount} não lidas</span>
          {unreadCount ? (
            <button className="button secondary" type="button" onClick={() => void markAllRead()}>
              Marcar todas como lidas
            </button>
          ) : null}
        </header>

        {status === 'loading' ? <p className="feed-status">Carregando notificações…</p> : null}
        {status === 'error' ? (
          <div className="empty-state" role="alert">
            <p>{error}</p>
            <button className="button secondary" type="button" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {status === 'ready' && notifications.length ? (
          <div className="notification-list">
            {notifications.map((item) => (
              <article key={item.id} className={`notification-item${item.readAt ? '' : ' unread'}`}>
                <div>
                  <span className="eyebrow">{item.type}</span>
                  <h2>{item.title}</h2>
                  {item.message ? <p>{item.message}</p> : null}
                </div>
                {item.link ? (
                  <Link to={item.link} onClick={() => void markRead(item)}>
                    Abrir
                  </Link>
                ) : !item.readAt ? (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void markRead(item)}
                  >
                    Marcar como lida
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {status === 'ready' && !notifications.length ? (
          <div className="empty-state">
            <p>Você ainda não tem notificações.</p>
          </div>
        ) : null}
      </section>
    </FeaturePage>
  );
}

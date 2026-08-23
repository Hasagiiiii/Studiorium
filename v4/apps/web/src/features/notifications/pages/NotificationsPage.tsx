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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

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
    if (item.readAt || updatingId) return;
    setUpdatingId(item.id);
    try {
      await services.notifications.markRead(item.id);
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, readAt } : entry)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível atualizar a notificação.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllRead() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await services.notifications.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, readAt: entry.readAt || readAt })),
      );
      setUnreadCount(0);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível atualizar as notificações.',
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <FeaturePage
      eyebrow="Notificações"
      title="Atualizações importantes"
      description="Acompanhe conexões e atividades registradas para sua conta."
    >
      <section className="notifications-panel" aria-live="polite">
        <header className="notifications-toolbar">
          <span>{unreadCount} não lidas</span>
          {unreadCount ? (
            <button
              className="button secondary"
              type="button"
              disabled={markingAll}
              onClick={() => void markAllRead()}
            >
              {markingAll ? 'Atualizando…' : 'Marcar todas como lidas'}
            </button>
          ) : null}
        </header>

        {error && status !== 'loading' ? (
          <div className="inline-feedback" role="alert">
            <p className="inline-error">{error}</p>
            {status === 'error' ? (
              <button className="button secondary" type="button" onClick={() => void load()}>
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {status === 'loading' ? <p className="feed-status">Carregando notificações…</p> : null}

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
                    disabled={updatingId === item.id}
                    onClick={() => void markRead(item)}
                  >
                    {updatingId === item.id ? 'Atualizando…' : 'Marcar como lida'}
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
